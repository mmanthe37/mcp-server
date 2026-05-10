/**
 * Connection Quality Metrics — monitors network quality and adapts behavior.
 * Tracks latency, jitter, packet loss, bandwidth estimation.
 */

export interface QualityMetrics {
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  bandwidthKbps: number;
  qualityScore: number; // 0-100
  recommendation: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export class ConnectionQualityMonitor {
  private latencySamples: number[] = [];
  private bandwidthSamples: number[] = [];
  private packetsSent = 0;
  private packetsLost = 0;

  private readonly windowSize: number;
  private readonly sampleInterval: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onMetricsCallback?: (metrics: QualityMetrics) => void;

  constructor(options?: { windowSize?: number; sampleIntervalMs?: number }) {
    this.windowSize = options?.windowSize ?? 30;
    this.sampleInterval = options?.sampleIntervalMs ?? 2000;
  }

  start(onMetrics: (metrics: QualityMetrics) => void): void {
    this.onMetricsCallback = onMetrics;
    this.timer = setInterval(() => {
      this.onMetricsCallback?.(this.getMetrics());
    }, this.sampleInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  recordLatency(ms: number): void {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > this.windowSize) {
      this.latencySamples.shift();
    }
  }

  recordBandwidth(bytesPerSecond: number): void {
    this.bandwidthSamples.push(bytesPerSecond / 125); // convert to kbps
    if (this.bandwidthSamples.length > this.windowSize) {
      this.bandwidthSamples.shift();
    }
  }

  recordPacketSent(): void {
    this.packetsSent++;
  }

  recordPacketLost(): void {
    this.packetsLost++;
  }

  getMetrics(): QualityMetrics {
    const latencyMs = this.average(this.latencySamples);
    const jitterMs = this.stddev(this.latencySamples);
    const bandwidthKbps = this.average(this.bandwidthSamples);
    const packetLossPercent = this.packetsSent > 0
      ? (this.packetsLost / this.packetsSent) * 100
      : 0;

    const qualityScore = this.computeScore(latencyMs, jitterMs, packetLossPercent, bandwidthKbps);
    const recommendation = this.scoreToRecommendation(qualityScore);

    return { latencyMs, jitterMs, packetLossPercent, bandwidthKbps, qualityScore, recommendation };
  }

  reset(): void {
    this.latencySamples = [];
    this.bandwidthSamples = [];
    this.packetsSent = 0;
    this.packetsLost = 0;
  }

  private computeScore(
    latency: number, jitter: number, loss: number, bandwidth: number
  ): number {
    // Weighted quality score: lower latency/jitter/loss = better, higher bandwidth = better
    const latencyScore = Math.max(0, 100 - latency / 5);     // 0ms=100, 500ms=0
    const jitterScore = Math.max(0, 100 - jitter * 2);       // 0ms=100, 50ms=0
    const lossScore = Math.max(0, 100 - loss * 10);           // 0%=100, 10%=0
    const bwScore = Math.min(100, bandwidth / 10);             // 1000kbps=100

    return Math.round(latencyScore * 0.35 + jitterScore * 0.2 + lossScore * 0.3 + bwScore * 0.15);
  }

  private scoreToRecommendation(score: number): QualityMetrics['recommendation'] {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 25) return 'poor';
    return 'critical';
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private stddev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const avg = this.average(arr);
    const squaredDiffs = arr.map((v) => (v - avg) ** 2);
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length);
  }
}
