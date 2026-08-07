import { PAINT_BUDGET_MS, type EngineStats } from "./types.js";

const WINDOW = 30;

export class PerfTracker {
  private samples: number[] = [];
  private lastFrameTs = 0;
  private fps = 0;

  recordPaint(
    paintMs: number,
    objectCount: number,
    visibleCount: number,
  ): EngineStats {
    this.samples.push(paintMs);
    if (this.samples.length > WINDOW) this.samples.shift();

    const now = performance.now();
    if (this.lastFrameTs > 0) {
      const dt = now - this.lastFrameTs;
      if (dt > 0) {
        const instant = 1000 / dt;
        this.fps = this.fps === 0 ? instant : this.fps * 0.85 + instant * 0.15;
      }
    }
    this.lastFrameTs = now;

    const sum = this.samples.reduce((a, b) => a + b, 0);
    const avg = sum / this.samples.length;

    return {
      lastPaintMs: paintMs,
      avgPaintMs: avg,
      objectCount,
      visibleCount,
      withinBudget: paintMs <= PAINT_BUDGET_MS,
      fps: this.fps,
    };
  }

  reset(): void {
    this.samples = [];
    this.lastFrameTs = 0;
    this.fps = 0;
  }
}
