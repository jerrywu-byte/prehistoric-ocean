import type { DirectionalView } from './types';

/** Two-view, edge-triggered transition. No angle-dependent opacity. */
export class TemporalDirectionTransition {
  current: DirectionalView = 'front';
  target: DirectionalView = 'front';
  source: DirectionalView | null = null;
  destination: DirectionalView | null = null;
  elapsed = 0;
  initialized = false;
  constructor(readonly durationMs: number) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('Invalid crossfade duration');
  }
  get active(): boolean { return this.destination !== null; }
  get progress(): number { return this.active ? Math.min(1, this.elapsed / (this.durationMs / 1000)) : 0; }
  get blend(): number { const t = this.progress; return t * t * (3 - 2 * t); }
  select(next: DirectionalView, immediate = false): void {
    if (!this.initialized || immediate) {
      this.initialized = true;
      this.target = next;
      this.collapse(next);
      return;
    }
    if (next === this.target) return;
    const dominant = this.active && this.blend >= 0.5 ? this.destination! : this.current;
    this.collapse(dominant);
    this.target = next;
    if (next !== dominant) {
      this.source = dominant;
      this.destination = next;
    }
  }
  update(deltaSeconds: number): void {
    if (!this.active || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    this.elapsed += deltaSeconds;
    if (this.elapsed + 1e-12 >= this.durationMs / 1000) this.collapse(this.destination!);
  }
  collapse(view: DirectionalView = this.destination ?? this.current): void {
    this.current = view;
    this.source = null;
    this.destination = null;
    this.elapsed = 0;
  }
}
