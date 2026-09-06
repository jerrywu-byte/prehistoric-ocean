import * as THREE from 'three';
import { Creature } from './Creature';
import type { CreatureConfig } from './creatureConfig';
import { getSeabedHeightAt, WORLD_LIMITS } from '../world/worldLimits';

export interface CreatureProximityState {
  readonly isNearby: boolean;
  readonly name: string;
  readonly subtitle: string;
}

export class CreatureManager {
  private readonly creatures: Creature[] = [];
  private readonly geometry = new THREE.PlaneGeometry(1, 1);
  private readonly texture: THREE.Texture;
  private readonly material: THREE.MeshBasicMaterial;
  private readonly spawnPosition = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private wasNearby = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly config: CreatureConfig,
    private readonly onProximityChange: (state: CreatureProximityState) => void,
  ) {
    this.texture = new THREE.TextureLoader().load(config.textureUrl);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.02,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: true,
      toneMapped: false,
    });

    this.addPrototypeCreature();
  }

  update(deltaSeconds: number): void {
    for (const creature of this.creatures) {
      creature.update(deltaSeconds, this.camera);
    }

    const prototype = this.creatures[0];

    if (!prototype) {
      return;
    }

    const isNearby = prototype.distanceSquaredTo(this.camera.position) <=
      this.config.interactionDistance ** 2;

    if (isNearby !== this.wasNearby) {
      this.wasNearby = isNearby;
      this.onProximityChange({
        isNearby,
        name: this.config.displayName,
        subtitle: this.config.subtitle,
      });
    }
  }

  dispose(): void {
    for (const creature of this.creatures) {
      this.scene.remove(creature.object3d);
    }

    this.creatures.length = 0;
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }

  private addPrototypeCreature(): void {
    this.camera.getWorldDirection(this.forward);
    this.forward.y = 0;
    this.forward.normalize();

    this.spawnPosition.copy(this.camera.position).addScaledVector(
      this.forward,
      this.config.spawnDistance,
    );
    this.spawnPosition.x = THREE.MathUtils.clamp(
      this.spawnPosition.x,
      WORLD_LIMITS.minX + this.config.boundaryMargin,
      WORLD_LIMITS.maxX - this.config.boundaryMargin,
    );
    this.spawnPosition.z = THREE.MathUtils.clamp(
      this.spawnPosition.z,
      WORLD_LIMITS.minZ + this.config.boundaryMargin,
      WORLD_LIMITS.maxZ - this.config.boundaryMargin,
    );
    this.spawnPosition.y = Math.max(
      this.config.spawnHeight,
      getSeabedHeightAt(this.spawnPosition.x, this.spawnPosition.z) + this.config.seabedClearance,
    );

    const creature = new Creature(this.config, this.geometry, this.material);
    const initialHeading = Math.atan2(this.forward.z, this.forward.x) + Math.PI / 2;
    creature.setInitialPosition(this.spawnPosition, initialHeading);
    this.creatures.push(creature);
    this.scene.add(creature.object3d);
  }
}
