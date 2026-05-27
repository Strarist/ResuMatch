import { StreamListener } from './StreamLifecycle';

export class StreamRegistry {
  private activeListeners = new Set<StreamListener>();
  private sessionId: string;
  private streamInstanceId: string;
  private creationTime: number;

  constructor() {
    this.sessionId = this.generateId();
    this.streamInstanceId = this.generateId();
    this.creationTime = Date.now();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getStreamInstanceId(): string {
    return this.streamInstanceId;
  }

  getCreationTime(): number {
    return this.creationTime;
  }

  registerListener(listener: StreamListener): void {
    this.activeListeners.add(listener);
  }

  unregisterListener(listener: StreamListener): boolean {
    return this.activeListeners.delete(listener);
  }

  getListenerCount(): number {
    return this.activeListeners.size;
  }

  getListeners(): Set<StreamListener> {
    return this.activeListeners;
  }

  clear(): void {
    this.activeListeners.clear();
    this.streamInstanceId = this.generateId(); // New instance ID on recreation
  }
}
