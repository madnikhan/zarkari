const SPEED_WINDOW_MS = 3000;

export interface SpeedSample {
  speedBps?: number;
  etaSec?: number;
}

export class UploadSpeedTracker {
  private samples: { at: number; bytes: number }[] = [];

  sample(bytesLoaded: number, bytesTotal: number): SpeedSample {
    const now = Date.now();
    this.samples.push({ at: now, bytes: bytesLoaded });
    this.samples = this.samples.filter((s) => now - s.at <= SPEED_WINDOW_MS);

    if (this.samples.length < 2 || bytesTotal <= 0) {
      return {};
    }

    const first = this.samples[0];
    const elapsedSec = (now - first.at) / 1000;
    if (elapsedSec <= 0) return {};

    const speedBps = (bytesLoaded - first.bytes) / elapsedSec;
    if (!Number.isFinite(speedBps) || speedBps <= 0) {
      return {};
    }

    const remaining = Math.max(0, bytesTotal - bytesLoaded);
    const etaSec = remaining > 0 ? Math.ceil(remaining / speedBps) : 0;

    return { speedBps, etaSec };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSpeed(bps: number): string {
  if (bps < 1024 * 1024) {
    return `${Math.round(bps / 1024)} KB/s`;
  }
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}
