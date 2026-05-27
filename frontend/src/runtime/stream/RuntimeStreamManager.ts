import { StreamListener, TransportState, TransportMetrics } from './StreamLifecycle';
import { TransportStateMachine } from './TransportStateMachine';
import { ReconnectCoordinator } from './ReconnectCoordinator';
import { StreamRegistry } from './StreamRegistry';

export class RuntimeStreamManager {
  private static instance: RuntimeStreamManager | null = null;

  private stateMachine: TransportStateMachine;
  private reconnectCoordinator: ReconnectCoordinator;
  private registry: StreamRegistry;
  private eventSource: EventSource | null = null;

  private lastEventTime = 0;
  private heartbeatCheckInterval: NodeJS.Timeout | null = null;
  private degradedCycles = 0;
  private reconnectCount = 0;
  private heartbeatLatency = 0;

  // double-mounting connection initiation guard
  private isConnectingLock = false;

  private constructor() {
    this.stateMachine = new TransportStateMachine('OFFLINE', (state) => {
      this.notifyStateChange(state);
    });
    this.reconnectCoordinator = new ReconnectCoordinator();
    this.registry = new StreamRegistry();
  }

  static getInstance(): RuntimeStreamManager {
    if (!RuntimeStreamManager.instance) {
      RuntimeStreamManager.instance = new RuntimeStreamManager();
    }
    return RuntimeStreamManager.instance;
  }

  private notifyStateChange(state: TransportState) {
    this.dispatchEvent('transport_state', { state });
  }

  getMetrics(): TransportMetrics {
    return {
      state: this.stateMachine.getState(),
      reconnectCount: this.reconnectCount,
      heartbeatLatency: this.heartbeatLatency,
      activeListeners: this.registry.getListenerCount(),
      degradedCycles: this.degradedCycles,
      cooldownState: this.stateMachine.getState() === 'COOLDOWN'
    };
  }

  registerListener(listener: StreamListener): void {
    this.registry.registerListener(listener);
    // Send current state instantly
    listener({ event: 'transport_state', data: { state: this.stateMachine.getState() } });
  }

  unregisterListener(listener: StreamListener): void {
    this.registry.unregisterListener(listener);
  }

  private dispatchEvent(event: string, data: unknown) {
    const listeners = this.registry.getListeners();
    listeners.forEach((listener) => {
      try {
        listener({ event, data });
      } catch (err) {
        console.error(`[Transport] Listener error for event ${event}:`, err);
      }
    });
  }

  connect(): void {
    const state = this.stateMachine.getState();
    if (state === 'LIVE' || state === 'CONNECTING' || state === 'RECONNECTING') {
      return;
    }

    if (this.isConnectingLock) {
      return;
    }
    this.isConnectingLock = true;

    this.stateMachine.transitionTo('CONNECTING');
    this.establishConnection();
  }

  private establishConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const isCooldown = this.stateMachine.getState() === 'COOLDOWN';
    const query = new URLSearchParams({
      session_id: this.registry.getSessionId(),
      stream_instance_id: this.registry.getStreamInstanceId(),
      reconnect_window: String(this.reconnectCoordinator.getRetryCount()),
      cooldown_state: String(isCooldown)
    });

    const url = `${baseUrl}/v1/intelligence/stream?${query.toString()}`;
    console.log(`[Transport] Establishing EventSource connection to: ${url}`);

    const sse = new EventSource(url);
    this.eventSource = sse;
    this.lastEventTime = Date.now();
    this.isConnectingLock = false;

    sse.onopen = () => {
      this.reconnectCoordinator.releaseLock();
      this.reconnectCoordinator.reset();
      this.stateMachine.transitionTo('LIVE');
      this.degradedCycles = 0;
      this.startHeartbeatMonitor();
    };

    const handleMessage = (e: MessageEvent, eventName: string) => {
      this.lastEventTime = Date.now();

      if (eventName === 'heartbeat') {
        this.heartbeatLatency = 45; // ms default
        this.dispatchEvent('heartbeat', {});
        return;
      }

      try {
        const parsed = JSON.parse(e.data);
        this.dispatchEvent(eventName, parsed);
      } catch (err) {
        console.warn(`[Transport] Failed to parse SSE event: ${eventName}`, err);
      }
    };

    sse.addEventListener('init', (e) => handleMessage(e, 'init'));
    sse.addEventListener('update', (e) => handleMessage(e, 'update'));
    sse.addEventListener('heartbeat', (e) => handleMessage(e, 'heartbeat'));

    sse.onerror = (err) => {
      console.warn('[Transport] EventSource connection error', err);
      this.handleConnectionFailure();
    };
  }

  private handleConnectionFailure(): void {
    this.stopHeartbeatMonitor();
    this.reconnectCount++;

    const state = this.stateMachine.getState();
    if (state === 'DESTROYED') return;

    if (this.reconnectCoordinator.getRetryCount() >= 5) {
      this.stateMachine.transitionTo('COOLDOWN');
      this.reconnectCoordinator.scheduleCooldown(10000, () => {
        this.stateMachine.transitionTo('CONNECTING');
        this.reconnectCoordinator.reset();
        this.establishConnection();
      });
    } else {
      this.stateMachine.transitionTo('RECONNECTING');
      this.reconnectCoordinator.scheduleReconnect(() => {
        this.establishConnection();
      });
    }
  }

  private startHeartbeatMonitor(): void {
    this.stopHeartbeatMonitor();
    this.heartbeatCheckInterval = setInterval(() => {
      const elapsed = Date.now() - this.lastEventTime;
      if (elapsed > 20000) {
        this.degradedCycles++;
        console.warn(`[Transport] Heartbeat missing for ${elapsed}ms. Transitioning to DEGRADED.`);
        this.stateMachine.transitionTo('DEGRADED');

        if (elapsed > 40000) {
          console.warn(`[Transport] Stale transport detected (no events for ${elapsed}ms). Reconnecting.`);
          this.handleConnectionFailure();
        }
      } else {
        if (this.stateMachine.getState() === 'DEGRADED') {
          this.stateMachine.transitionTo('LIVE');
        }
      }
    }, 5000);
  }

  private stopHeartbeatMonitor(): void {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }
  }

  safeDestroy(): void {
    console.log('[Transport] safeDestroy() triggered. Cleaning up all transport resources.');

    this.stateMachine.transitionTo('DESTROYED');

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.stopHeartbeatMonitor();
    this.reconnectCoordinator.clearTimers();
    this.reconnectCoordinator.reset();
    this.registry.clear();
    this.isConnectingLock = false;

    this.stateMachine = new TransportStateMachine('OFFLINE', (state) => {
      this.notifyStateChange(state);
    });
  }
}
