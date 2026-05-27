export type TransportState =
  | 'CONNECTING'
  | 'LIVE'
  | 'DEGRADED'
  | 'RECONNECTING'
  | 'COOLDOWN'
  | 'OFFLINE'
  | 'DESTROYED';

export interface StreamEvent {
  event: string;
  data: unknown;
}

export type StreamListener = (event: StreamEvent) => void;

export interface TransportMetrics {
  state: TransportState;
  reconnectCount: number;
  heartbeatLatency: number;
  activeListeners: number;
  degradedCycles: number;
  cooldownState: boolean;
}
