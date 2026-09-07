import * as THREE from 'three';
import { getTargetPitch, smoothPitch } from './directional/constrainedPitch';
import type { CreatureSpeciesDefinition } from '../species/SpeciesDefinition';
import type { DirectionalTextureSet } from './directional/types';
import type { CreatureSpawnConfig } from './CreatureSpawnConfig';
import { DIRECTIONAL_VIEWS, getDirectionalView, getRelativeAngle, type DirectionalView } from './directional/getDirectionalView';

export class Creature {
  readonly object3d: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly headingRadians: number;
  private directionalTextures: DirectionalTextureSet | null = null;
  private disposed = false;
  currentDirectionalView: DirectionalView | null = null;
  previousDirectionalView: DirectionalView | null = null;
  textureStatus: 'LOADING' | 'YES' | 'ERROR' = 'LOADING';
  relativeAngle = 0;
  distance = 0;
  verticalAngle = 0;
  targetPitch = 0;
  appliedPitch = 0;
  get view(): DirectionalView | null { return this.currentDirectionalView; }
  get directionIndex(): number {
    return this.view === null ? -1 : DIRECTIONAL_VIEWS.indexOf(this.view);
  }

  constructor(
    readonly species: CreatureSpeciesDefinition,
    readonly spawn: CreatureSpawnConfig,
    geometry: THREE.PlaneGeometry,
  ) {
    if (species.id !== spawn.speciesId) throw new Error('Spawn species does not match definition');
    const scale = spawn.scaleOverride ?? [species.defaultScale.width, species.defaultScale.height, 1];
    const heading = spawn.headingDegrees ?? species.orientation.defaultHeadingDegrees;
    const multiplier = spawn.scaleMultiplier ?? species.spawnDefaults.scaleMultiplier;
    if (!spawn.position.every(Number.isFinite) || !Number.isFinite(heading) ||
        !scale.every(v => Number.isFinite(v) && v > 0) || !Number.isFinite(multiplier) || multiplier <= 0) {
      throw new Error('Invalid creature spawn transform: ' + spawn.id);
    }
    const r = species.rendering;
    const material = new THREE.MeshBasicMaterial({
      color: r.fallbackColor, transparent: false, depthWrite: true,
      side: r.side, depthTest: r.depthTest, fog: r.fog, toneMapped: r.toneMapped,
    });
    this.object3d = new THREE.Mesh(geometry, material);
    this.object3d.name = spawn.id;
    this.object3d.position.set(...spawn.position);
    this.object3d.scale.set(scale[0] * multiplier, scale[1] * multiplier, scale[2] * multiplier);
    this.headingRadians = THREE.MathUtils.degToRad(heading);
  }

  initializeAssets(onChange: () => void): void {
    const fail = (error: unknown): void => {
      if (this.disposed) return;
      console.error('[Creature] Assets failed; keeping fallback:', this.species.id, this.species.directionalAssets.id, error);
      this.textureStatus = 'ERROR';
      onChange();
    };
    const apply = (textures: DirectionalTextureSet): void => {
      if (this.disposed) { this.disposeTextures(textures); return; }
      if (!DIRECTIONAL_VIEWS.every(view => textures[view]?.isTexture)) {
        this.disposeTextures(textures);
        throw new Error('Directional asset set must contain all eight views');
      }
      this.directionalTextures = textures;
      const material = this.object3d.material;
      const r = this.species.rendering;
      material.color.set(0xffffff);
      material.transparent = r.transparent;
      material.depthWrite = r.depthWrite;
      material.alphaTest = r.alphaTest;
      material.map = textures[this.view ?? 'front'];
      material.needsUpdate = true;
      this.textureStatus = 'YES';
      onChange();
    };
    try {
      const result = this.species.directionalAssets.load();
      if (result instanceof Promise) void result.then(apply).catch(fail);
      else apply(result);
    } catch (error) { fail(error); }
  }

  update(deltaSeconds: number, camera: THREE.Camera): void {
    const dx = camera.position.x - this.object3d.position.x;
    const dz = camera.position.z - this.object3d.position.z;
    this.distance = camera.position.distanceTo(this.object3d.position);
    const horizontalDistance = Math.hypot(dx, dz);
    const orientation = this.species.orientation;
    this.verticalAngle = Math.atan2(camera.position.y - this.object3d.position.y, horizontalDistance);
    const limited = this.species.rendering.billboard === 'constrainedPitch';
    this.targetPitch = limited
      ? getTargetPitch(this.verticalAngle, horizontalDistance, this.targetPitch, orientation)
      : 0;
    this.appliedPitch = limited
      ? smoothPitch(this.appliedPitch, this.targetPitch, deltaSeconds, orientation.billboardPitchResponseSeconds)
      : 0;
    // Preserve yaw and directional view at the vertical pole; pitch still updates smoothly.
    let yaw = this.object3d.rotation.y;
    if (horizontalDistance >= orientation.billboardHorizontalEpsilon) {
      this.relativeAngle = getRelativeAngle(dx, dz, this.headingRadians);
      const next = getDirectionalView(this.relativeAngle, this.view,
        THREE.MathUtils.degToRad(this.species.orientation.directionalHysteresisDegrees));
      if (next !== this.view) {
        this.previousDirectionalView = this.view;
        this.currentDirectionalView = next;
        if (this.directionalTextures) {
          this.object3d.material.map = this.directionalTextures[next];
          this.object3d.material.needsUpdate = true;
        }
      }
      yaw = Math.atan2(dx, dz);
    }
    // RY * RX: pitch around the yawed plane's horizontal axis, never world roll.
    // Plane normal is +Z, so an upward semantic pitch needs a negative Euler X.
    this.object3d.rotation.set(this.appliedPitch === 0 ? 0 : -this.appliedPitch, yaw, 0, 'YXZ');
  }

  distanceSquaredTo(position: THREE.Vector3): number {
    return this.object3d.position.distanceToSquared(position);
  }

  private disposeTextures(textures: DirectionalTextureSet): void {
    for (const texture of new Set(Object.values(textures))) texture?.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.directionalTextures) this.disposeTextures(this.directionalTextures);
    this.directionalTextures = null;
    this.object3d.material.dispose();
  }
}
