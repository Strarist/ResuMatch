export class ReconnectCoordinator {
  private retryCount = 0;
  private isReconnectingLock = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private cooldownTimer: NodeJS.Timeout | null = null;

  private readonly minDelay = 1000;
  private readonly maxDelay = 15000; // 15s MAX ceiling
  private readonly backoffFactor = 2;

  constructor() {}

  getRetryCount(): number {
    return this.retryCount;
  }

  isLocked(): boolean {
    return this.isReconnectingLock;
  }

  acquireLock(): boolean {
    if (this.isReconnectingLock) return false;
    this.isReconnectingLock = true;
    return true;
  }

  releaseLock(): void {
    this.isReconnectingLock = false;
  }

  reset(): void {
    this.retryCount = 0;
    this.isReconnectingLock = false;
    this.clearTimers();
  }

  clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  calculateDelay(): number {
    // 1s, 2s, 4s, 8s, 15s MAX
    const delay = Math.min(this.maxDelay, this.minDelay * Math.pow(this.backoffFactor, this.retryCount));
    // Apply jitter (add or subtract up to 20% random noise)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.max(1000, delay + jitter);
  }

  scheduleReconnect(reconnectCallback: () => void): void {
    this.clearTimers();
    this.retryCount++;
    const delay = this.calculateDelay();

    console.log(`[Transport] Scheduling reconnect retry #${this.retryCount} in ${Math.round(delay)}ms`);

    this.reconnectTimer = setTimeout(() => {
      reconnectCallback();
    }, delay);
  }

  scheduleCooldown(cooldownWindowMs: number, cooldownEndCallback: () => void): void {
    this.clearTimers();
    console.log(`[Transport] Transport entering cooldown window for ${cooldownWindowMs}ms`);

    this.cooldownTimer = setTimeout(() => {
      cooldownEndCallback();
    }, cooldownWindowMs);
  }
}
