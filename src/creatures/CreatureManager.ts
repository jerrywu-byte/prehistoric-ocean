import * as THREE from 'three';
import { Creature } from './Creature';
import type { CreatureConfig } from './creatureConfig';

export interface CreatureProximityState {
  readonly isNearby: boolean;
  readonly name: string;
  readonly subtitle: string;
}

export interface CreatureDebugState {
  readonly count: number;
  readonly visible: boolean;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly textureLoaded: boolean;
}

export class CreatureManager {
  private readonly creatures: Creature[] = [];
  private readonly geometry = new THREE.PlaneGeometry(1, 1);
  private readonly texture: THREE.Texture | null;
  private readonly material: THREE.MeshBasicMaterial;
  private wasNearby = false;
  private textureLoaded = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly config: CreatureConfig,
    private readonly onProximityChange: (state: CreatureProximityState) => void,
    private readonly onDebugChange: (state: CreatureDebugState) => void,
  ) {
    this.texture = config.useTexture
      ? new THREE.TextureLoader().load(
        config.textureUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          this.textureLoaded = true;
          this.reportDebugState();
        },
        undefined,
        (error) => {
          console.error('[CreatureManager] texture failed to load:', error);
          this.textureLoaded = false;
          this.reportDebugState();
        },
      )
      : null;

    this.material = new THREE.MeshBasicMaterial({
      color: config.materialColor,
      map: this.texture,
      opacity: 1,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      fog: config.materialFog,
      toneMapped: false,
    });

    this.addPrototypeCreature();
    this.reportDebugState();
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
    this.texture?.dispose();
  }

  private addPrototypeCreature(): void {
    const creature = new Creature(this.config, this.geometry, this.material);
    creature.object3d.visible = true;
    creature.setInitialPosition(
      new THREE.Vector3(...this.config.fixedPosition),
      0,
    );
    this.creatures.push(creature);
    this.scene.add(creature.object3d);
  }

  private reportDebugState(): void {
    const prototype = this.creatures[0];

    this.onDebugChange({
      count: this.creatures.length,
      visible: prototype?.object3d.visible ?? false,
      x: prototype?.object3d.position.x ?? 0,
      y: prototype?.object3d.position.y ?? 0,
      z: prototype?.object3d.position.z ?? 0,
      textureLoaded: this.textureLoaded,
    });
  }
}
