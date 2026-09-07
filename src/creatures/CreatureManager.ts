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
  readonly textureStatus: 'LOADING' | 'YES' | 'ERROR' | 'NO';
  readonly textureUrl: string;
  readonly materialMode: 'FALLBACK' | 'TEXTURE';
}

export class CreatureManager {
  private readonly creatures: Creature[] = [];
  private readonly geometry = new THREE.PlaneGeometry(1, 1);
  private texture: THREE.Texture | null = null;
  private readonly material: THREE.MeshBasicMaterial;
  private wasNearby = false;
  private textureStatus: CreatureDebugState['textureStatus'] = 'NO';
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly config: CreatureConfig,
    private readonly onProximityChange: (state: CreatureProximityState) => void,
    private readonly onDebugChange: (state: CreatureDebugState) => void,
  ) {
    this.material = new THREE.MeshBasicMaterial({
      color: config.materialColor,
      map: null,
      opacity: 1,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      fog: config.materialFog,
      toneMapped: false,
    });

    this.addPrototypeCreature();
    this.textureStatus = config.useTexture ? 'LOADING' : 'NO';
    this.reportDebugState();
    if (config.useTexture) this.loadTexture();
  }

  // The creature and its opaque fallback exist before any asynchronous request.
  private loadTexture(): void {
    try {
      this.texture = new THREE.TextureLoader().load(
        this.config.textureUrl,
        (texture) => {
          if (this.disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          this.material.color.set(0xffffff);
          this.material.map = texture;
          this.material.transparent = true;
          this.material.depthWrite = false;
          this.material.alphaTest = this.config.textureAlphaTest;
          this.material.needsUpdate = true;
          this.textureStatus = 'YES';
          this.reportDebugState();
        },
        undefined,
        this.handleTextureError,
      );
    } catch (error) {
      this.handleTextureError(error);
    }
  }

  private readonly handleTextureError = (error: unknown): void => {
    if (this.disposed) return;
    console.error(
      '[CreatureManager] Texture load failed; keeping orange fallback:',
      this.config.textureUrl,
      error,
    );
    this.texture?.dispose();
    this.texture = null;
    this.textureStatus = 'ERROR';
    this.reportDebugState();
  };

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
    this.disposed = true;
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
      textureStatus: this.textureStatus,
      textureUrl: this.config.textureUrl,
      materialMode: this.material.map ? 'TEXTURE' : 'FALLBACK',
    });
  }
}
