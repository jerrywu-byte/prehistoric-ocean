import * as THREE from 'three';
import type { LocomotionDefinition } from '../../species/SpeciesDefinition';
import { DeterministicRandom, hashString } from './deterministicRandom';

const MAX_WAYPOINT_ATTEMPTS = 24;
const TAU = Math.PI * 2;

export type LocomotionState = 'MOVING' | 'PAUSED';

export interface HorizontalMovementBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export function normalizeAngle(angle: number): number {
  return ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

export function shortestAngleDelta(from: number, to: number): number {
  return normalizeAngle(to - from);
}

export function moveTowards(current: number, target: number, maximumDelta: number): number {
  if (Math.abs(target - current) <= maximumDelta) return target;
  return current + Math.sign(target - current) * maximumDelta;
}

export function getHeadingSpeedFactor(absoluteDeltaRadians: number): number {
  const degrees = THREE.MathUtils.radToDeg(Math.abs(absoluteDeltaRadians));
  if (degrees <= 25) return 1;
  if (degrees <= 60) return THREE.MathUtils.lerp(1, 0.25, (degrees - 25) / 35);
  if (degrees <= 100) return THREE.MathUtils.lerp(0.25, 0, (degrees - 60) / 40);
  return 0;
}

export function getDeterministicLocomotionSeed(speciesId: string, instanceId: string): number {
  return hashString(`${speciesId}:${instanceId}`);
}

type GentleRoamConfig = Extract<LocomotionDefinition, { readonly mode: 'gentle_roam' }>;

export class GentleRoamLocomotion {
  readonly position = new THREE.Vector3();
  readonly target = new THREE.Vector3();
  state: LocomotionState = 'MOVING';
  speed = 0;
  headingRadians: number;
  targetHeadingRadians: number;
  headingDeltaRadians = 0;
  distanceToTarget = 0;
  pauseRemainingSeconds = 0;
  private readonly random: DeterministicRandom;

  constructor(
    readonly home: THREE.Vector3,
    initialHeadingRadians: number,
    readonly config: GentleRoamConfig,
    readonly bounds: HorizontalMovementBounds,
    seed: number,
  ) {
    this.validateConfig();
    this.random = new DeterministicRandom(seed);
    this.position.copy(home);
    this.position.x = THREE.MathUtils.clamp(this.position.x, bounds.minX, bounds.maxX);
    this.position.z = THREE.MathUtils.clamp(this.position.z, bounds.minZ, bounds.maxZ);
    this.headingRadians = normalizeAngle(initialHeadingRadians);
    this.targetHeadingRadians = this.headingRadians;
    this.selectNextTarget();
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    if (this.state === 'PAUSED') {
      this.speed = moveTowards(this.speed, 0, this.config.deceleration * deltaSeconds);
      this.pauseRemainingSeconds = Math.max(0, this.pauseRemainingSeconds - deltaSeconds);
      if (this.pauseRemainingSeconds === 0) {
        this.selectNextTarget();
        this.state = 'MOVING';
      }
      return;
    }

    const dx = this.target.x - this.position.x;
    const dz = this.target.z - this.position.z;
    this.distanceToTarget = Math.hypot(dx, dz);
    if (this.distanceToTarget <= this.config.arrivalRadius) {
      this.arrive();
      return;
    }

    this.targetHeadingRadians = Math.atan2(dz, dx);
    const turnBefore = shortestAngleDelta(this.headingRadians, this.targetHeadingRadians);
    const maximumTurn = THREE.MathUtils.degToRad(this.config.maxTurnRateDegreesPerSecond) * deltaSeconds;
    this.headingRadians = normalizeAngle(this.headingRadians + THREE.MathUtils.clamp(turnBefore, -maximumTurn, maximumTurn));
    this.headingDeltaRadians = shortestAngleDelta(this.headingRadians, this.targetHeadingRadians);

    // Retain a small approach speed at the arrival radius so the creature
    // crosses the threshold instead of asymptotically stalling outside it.
    const arrivalFactor = THREE.MathUtils.clamp(
      this.distanceToTarget / this.config.slowdownRadius,
      0,
      1,
    );
    const desiredSpeed = this.config.cruiseSpeed * arrivalFactor * getHeadingSpeedFactor(this.headingDeltaRadians);
    const rate = desiredSpeed >= this.speed ? this.config.acceleration : this.config.deceleration;
    this.speed = moveTowards(this.speed, desiredSpeed, rate * deltaSeconds);
    this.speed = THREE.MathUtils.clamp(this.speed, 0, this.config.cruiseSpeed);

    const step = Math.min(this.speed * deltaSeconds, this.distanceToTarget);
    this.position.x += Math.cos(this.headingRadians) * step;
    this.position.z += Math.sin(this.headingRadians) * step;
    this.position.x = THREE.MathUtils.clamp(this.position.x, this.bounds.minX, this.bounds.maxX);
    this.position.z = THREE.MathUtils.clamp(this.position.z, this.bounds.minZ, this.bounds.maxZ);
    this.distanceToTarget = Math.hypot(this.target.x - this.position.x, this.target.z - this.position.z);
    if (this.distanceToTarget <= this.config.arrivalRadius) this.arrive();
  }

  private arrive(): void {
    this.speed = 0;
    this.distanceToTarget = Math.hypot(this.target.x - this.position.x, this.target.z - this.position.z);
    this.headingDeltaRadians = 0;
    this.pauseRemainingSeconds = THREE.MathUtils.lerp(
      this.config.pauseMinSeconds,
      this.config.pauseMaxSeconds,
      this.random.next(),
    );
    this.state = 'PAUSED';
  }

  private selectNextTarget(): void {
    for (let attempt = 0; attempt < MAX_WAYPOINT_ATTEMPTS; attempt += 1) {
      const angle = this.random.next() * TAU;
      const radius = Math.sqrt(this.random.next()) * this.config.horizontalRoamRadius;
      const x = this.home.x + Math.cos(angle) * radius;
      const z = this.home.z + Math.sin(angle) * radius;
      if (x < this.bounds.minX || x > this.bounds.maxX || z < this.bounds.minZ || z > this.bounds.maxZ) continue;
      if (Math.hypot(x - this.position.x, z - this.position.z) < this.config.minimumTargetDistance) continue;
      this.target.set(x, this.position.y, z);
      this.updateTargetMetrics();
      return;
    }

    // Deterministic bounded fallback: choose the farthest valid point on a fixed ring.
    let bestDistance = -1;
    const fallbackRadius = Math.min(
      this.config.horizontalRoamRadius,
      Math.max(this.config.minimumTargetDistance, this.config.horizontalRoamRadius * 0.75),
    );
    for (let index = 0; index < 64; index += 1) {
      const angle = index / 64 * TAU;
      const x = THREE.MathUtils.clamp(this.home.x + Math.cos(angle) * fallbackRadius, this.bounds.minX, this.bounds.maxX);
      const z = THREE.MathUtils.clamp(this.home.z + Math.sin(angle) * fallbackRadius, this.bounds.minZ, this.bounds.maxZ);
      const distance = Math.hypot(x - this.position.x, z - this.position.z);
      if (distance > bestDistance) {
        bestDistance = distance;
        this.target.set(x, this.position.y, z);
      }
    }
    this.updateTargetMetrics();
  }

  private updateTargetMetrics(): void {
    this.distanceToTarget = Math.hypot(this.target.x - this.position.x, this.target.z - this.position.z);
    this.targetHeadingRadians = Math.atan2(this.target.z - this.position.z, this.target.x - this.position.x);
    this.headingDeltaRadians = shortestAngleDelta(this.headingRadians, this.targetHeadingRadians);
  }

  private validateConfig(): void {
    const c = this.config;
    const positive = [c.horizontalRoamRadius, c.cruiseSpeed, c.acceleration, c.deceleration,
      c.slowdownRadius, c.arrivalRadius, c.maxTurnRateDegreesPerSecond, c.minimumTargetDistance,
      c.pauseMinSeconds, c.pauseMaxSeconds];
    if (!positive.every(value => Number.isFinite(value) && value > 0)
      || c.arrivalRadius >= c.slowdownRadius
      || c.minimumTargetDistance > c.horizontalRoamRadius
      || c.pauseMinSeconds > c.pauseMaxSeconds) {
      throw new Error('Invalid gentle roam locomotion config');
    }
  }
}
