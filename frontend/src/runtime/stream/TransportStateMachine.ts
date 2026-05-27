import { TransportState } from './StreamLifecycle';

export class TransportStateMachine {
  private currentState: TransportState = 'OFFLINE';
  private onStateChangeCallback?: (state: TransportState) => void;

  constructor(initialState: TransportState, onStateChange?: (state: TransportState) => void) {
    this.currentState = initialState;
    this.onStateChangeCallback = onStateChange;
  }

  getState(): TransportState {
    return this.currentState;
  }

  transitionTo(nextState: TransportState): boolean {
    if (this.currentState === nextState) return false;

    // Transition validation matrix
    let allowed = false;

    if (nextState === 'DESTROYED') {
      allowed = true; // ANY -> DESTROYED
    } else {
      switch (this.currentState) {
        case 'CONNECTING':
          allowed = nextState === 'LIVE' || nextState === 'OFFLINE' || nextState === 'DEGRADED';
          break;
        case 'LIVE':
          allowed = nextState === 'DEGRADED' || nextState === 'OFFLINE';
          break;
        case 'DEGRADED':
          allowed = nextState === 'RECONNECTING' || nextState === 'OFFLINE' || nextState === 'LIVE';
          break;
        case 'RECONNECTING':
          allowed = nextState === 'LIVE' || nextState === 'COOLDOWN' || nextState === 'OFFLINE';
          break;
        case 'COOLDOWN':
          allowed = nextState === 'CONNECTING' || nextState === 'OFFLINE';
          break;
        case 'OFFLINE':
          allowed = nextState === 'CONNECTING' || nextState === 'RECONNECTING';
          break;
        case 'DESTROYED':
          allowed = false; // DESTROYED is terminal, cannot transition out unless recreated
          break;
      }
    }

    if (allowed) {
      this.currentState = nextState;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(nextState);
      }
      return true;
    }

    console.warn(`[Transport] Ignored invalid state transition from ${this.currentState} to ${nextState}`);
    return false;
  }
}
