import * as THREE from 'three';
import { getTargetPitch, smoothPitch } from './directional/constrainedPitch';
import type { CreatureSpeciesDefinition } from '../species/SpeciesDefinition';
import { PITCH_LAYERS, getPitchLayer, isPitchTextureSet, type CreatureTextureSet, type PitchLayer } from './directional/pitchLayers';
import type { CreatureSpawnConfig } from './CreatureSpawnConfig';
import { DIRECTIONAL_VIEWS, getDirectionalView, getRelativeAngle, type DirectionalView } from './directional/getDirectionalView';
import { calculateAmbientMotionOffset, getDeterministicMotionPhase } from './motion/ambientMotion';
import { GentleRoamLocomotion, getDeterministicLocomotionSeed } from './motion/gentleRoam';
import { WORLD_LIMITS, constrainCreaturePosition } from '../world/worldLimits';

export class Creature {
  readonly object3d: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  headingRadians: number;
  readonly anchorPosition = new THREE.Vector3();
  readonly locomotionPosition = new THREE.Vector3();
  readonly motionOffset = new THREE.Vector3();
  readonly motionPhase: number;
  readonly locomotion: GentleRoamLocomotion | null;
  private directionalTextures: CreatureTextureSet | null = null;
  private disposed = false;
  private motionElapsedSeconds = 0;
  currentDirectionalView: DirectionalView | null = null;
  currentPitchLayer: PitchLayer | null = null;
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
    const motionPhase = spawn.motionPhase ?? getDeterministicMotionPhase(spawn.id);
    const locomotionSeed = spawn.locomotionSeed ?? getDeterministicLocomotionSeed(species.id, spawn.id);
    if (!spawn.position.every(Number.isFinite) || !Number.isFinite(heading) || !Number.isFinite(motionPhase)
        || !Number.isFinite(locomotionSeed) ||
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
    this.anchorPosition.copy(this.object3d.position);
    this.locomotionPosition.copy(this.anchorPosition);
    this.object3d.scale.set(scale[0] * multiplier, scale[1] * multiplier, scale[2] * multiplier);
    this.headingRadians = THREE.MathUtils.degToRad(heading);
    this.motionPhase = motionPhase;
    const locomotionConfig = species.movement.locomotion;
    this.locomotion = species.movement.enabled && locomotionConfig.enabled
      ? new GentleRoamLocomotion(
          this.anchorPosition,
          this.headingRadians,
          locomotionConfig,
          {
            minX: WORLD_LIMITS.minX + this.object3d.scale.x * 0.5,
            maxX: WORLD_LIMITS.maxX - this.object3d.scale.x * 0.5,
            minZ: WORLD_LIMITS.minZ + this.object3d.scale.x * 0.5,
            maxZ: WORLD_LIMITS.maxZ - this.object3d.scale.x * 0.5,
          },
          locomotionSeed,
        )
      : null;
  }

  initializeAssets(onChange: () => void): void {
    const fail = (error: unknown): void => {
      if (this.disposed) return;
      console.error('[Creature] Assets failed; keeping fallback:', this.species.id, this.species.directionalAssets.id, error);
      this.textureStatus = 'ERROR';
      onChange();
    };
    const apply = (textures: CreatureTextureSet): void => {
      if (this.disposed) { this.disposeTextures(textures); return; }
      const layered = this.species.rendering.mode === 'pitch_directional_8x3';
      const valid = layered
        ? isPitchTextureSet(textures) && PITCH_LAYERS.every(layer => DIRECTIONAL_VIEWS.every(view => textures[layer]?.[view]?.isTexture))
        : !isPitchTextureSet(textures) && DIRECTIONAL_VIEWS.every(view => textures[view]?.isTexture);
      if (!valid) {
        this.disposeTextures(textures);
        throw new Error('Directional asset set is incomplete or does not match rendering mode');
      }
      this.directionalTextures = textures;
      const material = this.object3d.material;
      const r = this.species.rendering;
      material.color.set(0xffffff);
      material.transparent = r.transparent;
      material.depthWrite = r.depthWrite;
      material.alphaTest = r.alphaTest;
      material.map = this.selectedTexture();
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
    if (Number.isFinite(deltaSeconds) && deltaSeconds > 0) {
      this.motionElapsedSeconds += deltaSeconds;
      this.locomotion?.update(deltaSeconds);
    }
    if (this.locomotion) {
      this.locomotionPosition.copy(this.locomotion.position);
      this.headingRadians = this.locomotion.headingRadians;
    }
    calculateAmbientMotionOffset(
      this.motionElapsedSeconds,
      this.motionPhase,
      this.species.movement.ambientMotion,
      this.motionOffset,
    );
    this.object3d.position.copy(this.locomotionPosition).add(this.motionOffset);
    constrainCreaturePosition(this.object3d.position, this.object3d.scale.x * 0.5, this.object3d.scale.y * 0.5);

    const dx = camera.position.x - this.object3d.position.x;
    const dz = camera.position.z - this.object3d.position.z;
    this.distance = camera.position.distanceTo(this.object3d.position);
    const horizontalDistance = Math.hypot(dx, dz);
    const orientation = this.species.orientation;
    this.verticalAngle = Math.atan2(camera.position.y - this.object3d.position.y, horizontalDistance);
    if (this.species.rendering.mode === 'pitch_directional_8x3') {
      this.currentPitchLayer = getPitchLayer(THREE.MathUtils.radToDeg(this.verticalAngle), this.currentPitchLayer,
        orientation.pitchLayerThresholdDegrees, orientation.pitchLayerHysteresisDegrees);
    }
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
      }
      yaw = Math.atan2(dx, dz);
    }
    if (this.currentDirectionalView === null) this.currentDirectionalView = 'front';
    const selected = this.selectedTexture();
    if (selected && this.object3d.material.map !== selected) {
      this.object3d.material.map = selected;
      this.object3d.material.needsUpdate = true;
    }
    // The full camera-facing mode depends only on position, never camera roll.
    // At the pole retain yaw to keep up stable; elevation still reaches ±90°.
    if (this.species.rendering.billboard === 'cameraFacing') {
      this.appliedPitch = this.verticalAngle;
    }
    // RY * RX: pitch around the yawed plane's horizontal axis, never world roll.
    // Plane normal is +Z, so an upward semantic pitch needs a negative Euler X.
    this.object3d.rotation.set(this.appliedPitch === 0 ? 0 : -this.appliedPitch, yaw, 0, 'YXZ');
  }

  distanceSquaredTo(position: THREE.Vector3): number {
    return this.object3d.position.distanceToSquared(position);
  }

  private selectedTexture(): THREE.Texture | null {
    const set = this.directionalTextures;
    if (!set) return null;
    return isPitchTextureSet(set)
      ? set[this.currentPitchLayer ?? 'mid'][this.view ?? 'front']
      : set[this.view ?? 'front'];
  }

  private disposeTextures(textures: CreatureTextureSet): void {
    const values = isPitchTextureSet(textures)
      ? Object.values(textures).flatMap(layer => Object.values(layer))
      : Object.values(textures);
    for (const texture of new Set(values)) texture?.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.directionalTextures) this.disposeTextures(this.directionalTextures);
    this.directionalTextures = null;
    this.object3d.material.dispose();
  }
}
