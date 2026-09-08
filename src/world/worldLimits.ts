import * as THREE from 'three';

export const WORLD_LIMITS = {
  minX: -55,
  maxX: 55,
  minZ: -55,
  maxZ: 55,
  maxY: 14,
  seabedBaseY: -1.5,
  seabedClearance: 1.15,
} as const;

export function getSeabedHeightAt(x: number, z: number): number {
  return (
    WORLD_LIMITS.seabedBaseY +
    Math.sin(x * 0.12) * 0.28 +
    Math.cos(z * 0.09) * 0.22
  );
}

export function constrainDiverPosition(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
): void {
  if (position.x < WORLD_LIMITS.minX || position.x > WORLD_LIMITS.maxX) {
    position.x = THREE.MathUtils.clamp(position.x, WORLD_LIMITS.minX, WORLD_LIMITS.maxX);
    velocity.x = 0;
  }

  if (position.z < WORLD_LIMITS.minZ || position.z > WORLD_LIMITS.maxZ) {
    position.z = THREE.MathUtils.clamp(position.z, WORLD_LIMITS.minZ, WORLD_LIMITS.maxZ);
    velocity.z = 0;
  }

  const minimumY = getSeabedHeightAt(position.x, position.z) + WORLD_LIMITS.seabedClearance;

  if (position.y < minimumY || position.y > WORLD_LIMITS.maxY) {
    position.y = THREE.MathUtils.clamp(position.y, minimumY, WORLD_LIMITS.maxY);
    velocity.y = 0;
  }
}

export function constrainCreaturePosition(position: THREE.Vector3, halfWidth: number, halfHeight: number): void {
  position.x = THREE.MathUtils.clamp(position.x, WORLD_LIMITS.minX + halfWidth, WORLD_LIMITS.maxX - halfWidth);
  position.z = THREE.MathUtils.clamp(position.z, WORLD_LIMITS.minZ + halfWidth, WORLD_LIMITS.maxZ - halfWidth);
  const minimumY = getSeabedHeightAt(position.x, position.z) + Math.max(0, halfHeight);
  position.y = THREE.MathUtils.clamp(position.y, minimumY, WORLD_LIMITS.maxY);
}
