import * as THREE from 'three';
import type { CreatureConfig } from './creatureConfig';
import { getSeabedHeightAt, WORLD_LIMITS } from '../world/worldLimits';

const FULL_TURN = Math.PI * 2;

function moveAngleTowards(current: number, target: number, maxStep: number): number {
  const difference = THREE.MathUtils.euclideanModulo(
    target - current + Math.PI,
    FULL_TURN,
  ) - Math.PI;

  return current + THREE.MathUtils.clamp(difference, -maxStep, maxStep);
}

export class Creature {
  readonly object3d: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  private readonly anchor = new THREE.Vector3();
  private readonly swimDirection = new THREE.Vector3();
  private elapsedSeconds = 0;
  private heading = 0;
  private baseHeading = 0;
  private swimCenterY = 0;

  constructor(
    private readonly config: CreatureConfig,
    geometry: THREE.PlaneGeometry,
    material: THREE.MeshBasicMaterial,
  ) {
    this.object3d = new THREE.Mesh(geometry, material);
    this.object3d.name = config.id;
    this.object3d.scale.set(config.width, config.height, 1);
    this.object3d.renderOrder = 0;
  }

  setInitialPosition(position: THREE.Vector3, heading: number): void {
    this.object3d.position.copy(position);
    this.anchor.copy(position);
    this.heading = heading;
    this.baseHeading = heading;
    this.swimCenterY = position.y;
  }

  update(deltaSeconds: number, camera: THREE.Camera): void {
    this.elapsedSeconds += deltaSeconds;

    const offsetX = this.object3d.position.x - this.anchor.x;
    const offsetZ = this.object3d.position.z - this.anchor.z;
    const outsideRoamArea = offsetX * offsetX + offsetZ * offsetZ > this.config.roamRadius ** 2;
    const nearWorldEdge =
      this.object3d.position.x < WORLD_LIMITS.minX + this.config.boundaryMargin ||
      this.object3d.position.x > WORLD_LIMITS.maxX - this.config.boundaryMargin ||
      this.object3d.position.z < WORLD_LIMITS.minZ + this.config.boundaryMargin ||
      this.object3d.position.z > WORLD_LIMITS.maxZ - this.config.boundaryMargin;

    const targetHeading = outsideRoamArea || nearWorldEdge
      ? Math.atan2(this.anchor.z - this.object3d.position.z, this.anchor.x - this.object3d.position.x)
      : this.baseHeading + Math.sin(this.elapsedSeconds * this.config.swayFrequency) * this.config.swayAmplitude;

    this.heading = moveAngleTowards(
      this.heading,
      targetHeading,
      this.config.maxTurnRate * deltaSeconds,
    );

    const speed = this.config.baseSpeed +
      Math.sin(this.elapsedSeconds * this.config.speedFrequency) * this.config.speedVariation;
    this.swimDirection.set(Math.cos(this.heading), 0, Math.sin(this.heading));
    this.object3d.position.addScaledVector(this.swimDirection, speed * deltaSeconds);

    this.object3d.position.x = THREE.MathUtils.clamp(
      this.object3d.position.x,
      WORLD_LIMITS.minX + this.config.boundaryMargin,
      WORLD_LIMITS.maxX - this.config.boundaryMargin,
    );
    this.object3d.position.z = THREE.MathUtils.clamp(
      this.object3d.position.z,
      WORLD_LIMITS.minZ + this.config.boundaryMargin,
      WORLD_LIMITS.maxZ - this.config.boundaryMargin,
    );

    const bobOffset = Math.sin(this.elapsedSeconds * this.config.bobFrequency) * this.config.bobAmplitude;
    const minimumY = getSeabedHeightAt(
      this.object3d.position.x,
      this.object3d.position.z,
    ) + this.config.seabedClearance;
    this.object3d.position.y = THREE.MathUtils.clamp(
      Math.max(this.swimCenterY + bobOffset, minimumY),
      minimumY,
      WORLD_LIMITS.maxY - this.config.seabedClearance,
    );

    if (this.config.facingMode === 'billboard') {
      this.object3d.quaternion.copy(camera.quaternion);
    } else {
      this.object3d.rotation.set(0, -this.heading, 0);
    }
  }

  distanceSquaredTo(position: THREE.Vector3): number {
    return this.object3d.position.distanceToSquared(position);
  }
}
