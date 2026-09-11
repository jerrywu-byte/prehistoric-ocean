import * as THREE from 'three';
import { getTargetPitch, smoothPitch } from './directional/constrainedPitch';
import type { CreatureSpeciesDefinition } from '../species/SpeciesDefinition';
import { PITCH_LAYERS, getPitchLayer, isPitchTextureSet, type CreatureTextureSet, type PitchLayer } from './directional/pitchLayers';
import type { CreatureSpawnConfig } from './CreatureSpawnConfig';
import {
  DIRECTIONAL_VIEWS,
  getDirectionalView,
  getRelativeAngle,
  getWrappedDirectionIndexDelta,
} from './directional/getDirectionalView';
import {
  DIRECTIONAL_16_VIEWS,
  getMissingDirectionalViews,
  type HorizontalDirectionalView,
} from './directional/types';
import { calculateAmbientMotionOffset, getDeterministicMotionPhase } from './motion/ambientMotion';
import { GentleRoamLocomotion, getDeterministicLocomotionSeed } from './motion/gentleRoam';
import { WORLD_LIMITS, constrainCreaturePosition } from '../world/worldLimits';
import { TemporalDirectionTransition } from './directional/TemporalDirectionTransition';

export class Creature {
  readonly object3d: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly secondaryObject3d: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  headingRadians: number;
  readonly anchorPosition = new THREE.Vector3();
  readonly locomotionPosition = new THREE.Vector3();
  readonly motionOffset = new THREE.Vector3();
  readonly motionPhase: number;
  readonly locomotion: GentleRoamLocomotion | null;
  private directionalTextures: CreatureTextureSet | null = null;
  private disposed = false;
  private motionElapsedSeconds = 0;
  currentDirectionalView: HorizontalDirectionalView | null = null;
  secondaryDirectionalView: HorizontalDirectionalView | null = null;
  currentPitchLayer: PitchLayer | null = null;
  previousDirectionalView: HorizontalDirectionalView | null = null;
  missingAssetKeys: readonly HorizontalDirectionalView[] = [];
  textureStatus: 'LOADING' | 'YES' | 'ERROR' = 'LOADING';
  relativeAngle = 0;
  horizontalBlend = 0;
  readonly horizontalTransition: TemporalDirectionTransition;
  distance = 0;
  verticalAngle = 0;
  targetPitch = 0;
  appliedPitch = 0;
  previousSelectedDirection: HorizontalDirectionalView | null = null;
  currentSelectedDirection: HorizontalDirectionalView | null = null;
  previousDirectionIndex = -1;
  currentDirectionIndex = -1;
  directionIndexDelta = 0;
  nonAdjacentDirectionJump = false;
  get view(): HorizontalDirectionalView | null { return this.currentDirectionalView; }
  get directionIndex(): number {
    return this.view === null ? -1 : this.horizontalViews.indexOf(this.view);
  }
  get sectorSizeDegrees(): number { return 360 / this.horizontalViews.length; }
  get requestedTexture(): THREE.Texture | null { return this.selectedTexture(this.view); }
  private get horizontalViews(): readonly HorizontalDirectionalView[] {
    return this.species.rendering.mode === 'directional_16'
      || this.species.rendering.mode === 'pitch_directional_16x3'
      ? DIRECTIONAL_16_VIEWS
      : DIRECTIONAL_VIEWS;
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
    this.horizontalTransition = new TemporalDirectionTransition(r.horizontalDirectionTransition.durationMs);
    const material = new THREE.MeshBasicMaterial({
      color: r.fallbackColor, transparent: false, depthWrite: true,
      side: r.side, depthTest: r.depthTest, fog: r.fog, toneMapped: r.toneMapped,
    });
    this.object3d = new THREE.Mesh(geometry, material);
    this.object3d.name = spawn.id;
    this.object3d.renderOrder = 10;
    const secondaryMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: r.side,
      depthTest: r.depthTest,
      fog: r.fog,
      toneMapped: r.toneMapped,
    });
    this.secondaryObject3d = new THREE.Mesh(geometry, secondaryMaterial);
    this.secondaryObject3d.name = spawn.id + '-direction-blend';
    this.secondaryObject3d.renderOrder = 11;
    this.secondaryObject3d.visible = false;
    this.object3d.add(this.secondaryObject3d);
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
      const layered = this.species.rendering.mode === 'pitch_directional_8x3'
        || this.species.rendering.mode === 'pitch_directional_16x3';
      const views = this.horizontalViews;
      const valid = layered
        ? isPitchTextureSet(textures) && PITCH_LAYERS.every(layer => views.every(view => textures[layer]?.[view]?.isTexture))
        : !isPitchTextureSet(textures)
          && views.every(view => (textures as Partial<Record<HorizontalDirectionalView, THREE.Texture>>)[view]?.isTexture);
      if (!valid) {
        this.disposeTextures(textures);
        throw new Error('Directional asset set is incomplete or does not match rendering mode');
      }
      this.directionalTextures = textures;
      this.missingAssetKeys = getMissingDirectionalViews(textures);
      const material = this.object3d.material;
      const secondaryMaterial = this.secondaryObject3d.material;
      const r = this.species.rendering;
      material.color.set(0xffffff);
      material.transparent = r.transparent;
      material.depthWrite = r.depthWrite;
      material.alphaTest = r.alphaTest;
      secondaryMaterial.transparent = r.transparent;
      secondaryMaterial.depthWrite = r.depthWrite;
      secondaryMaterial.alphaTest = r.alphaTest;
      this.updateDirectionalMaterials();
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
    const previousPitchLayer = this.currentPitchLayer;
    if (this.species.rendering.mode === 'pitch_directional_8x3'
        || this.species.rendering.mode === 'pitch_directional_16x3') {
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
      const config = this.species.rendering.horizontalDirectionTransition;
      const next = getDirectionalView(this.relativeAngle,
        this.horizontalTransition.initialized ? this.horizontalTransition.target : null,
        THREE.MathUtils.degToRad(config.enabled ? config.hysteresisDegrees : orientation.directionalHysteresisDegrees),
        this.horizontalViews);
      const previousTarget = this.horizontalTransition.initialized
        ? this.horizontalTransition.target
        : null;
      if (next !== previousTarget) {
        const nextIndex = this.horizontalViews.indexOf(next);
        const previousIndex = previousTarget === null
          ? nextIndex
          : this.horizontalViews.indexOf(previousTarget);
        this.previousSelectedDirection = previousTarget ?? next;
        this.currentSelectedDirection = next;
        this.previousDirectionIndex = previousIndex;
        this.currentDirectionIndex = nextIndex;
        this.directionIndexDelta = getWrappedDirectionIndexDelta(
          previousIndex,
          nextIndex,
          this.horizontalViews.length,
        );
        this.nonAdjacentDirectionJump = Math.abs(this.directionIndexDelta) > 1;
      }
      if (next !== this.view) {
        this.previousDirectionalView = this.view;
        this.currentDirectionalView = next;
      }
      this.horizontalTransition.select(next, !config.enabled);
      yaw = Math.atan2(dx, dz);
    }
    if (previousPitchLayer !== this.currentPitchLayer) this.horizontalTransition.collapse();
    else this.horizontalTransition.update(deltaSeconds);
    this.currentDirectionalView = this.horizontalTransition.current;
    this.secondaryDirectionalView = this.horizontalTransition.destination;
    this.horizontalBlend = this.horizontalTransition.blend;
    this.updateDirectionalMaterials();
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

  private selectedTexture(view: HorizontalDirectionalView | null): THREE.Texture | null {
    const set = this.directionalTextures;
    if (!set) return null;
    return isPitchTextureSet(set)
      ? set[this.currentPitchLayer ?? 'mid'][view as keyof typeof set.mid ?? 'front'] ?? null
      : (set as Partial<Record<HorizontalDirectionalView, THREE.Texture>>)[view ?? 'front'] ?? null;
  }

  private updateDirectionalMaterials(): void {
    const primaryMaterial = this.object3d.material;
    const secondaryMaterial = this.secondaryObject3d.material;
    const primaryTexture = this.selectedTexture(this.view);
    if (!primaryTexture) {
      primaryMaterial.opacity = 1;
      secondaryMaterial.opacity = 0;
      secondaryMaterial.map = null;
      this.secondaryObject3d.visible = false;
      return;
    }
    if (primaryMaterial.map !== primaryTexture) {
      primaryMaterial.map = primaryTexture;
      primaryMaterial.needsUpdate = true;
    }
    const secondaryTexture = this.selectedTexture(this.secondaryDirectionalView);
    const isBlending = this.secondaryDirectionalView !== null
      && secondaryTexture !== null
      && this.horizontalBlend > 0;
    primaryMaterial.opacity = isBlending ? 1 - this.horizontalBlend : 1;
    this.secondaryObject3d.visible = isBlending;
    secondaryMaterial.opacity = isBlending ? this.horizontalBlend : 0;
    if (!isBlending && secondaryMaterial.map !== null) {
      secondaryMaterial.map = null;
      secondaryMaterial.needsUpdate = true;
    }
    if (isBlending && secondaryMaterial.map !== secondaryTexture) {
      secondaryMaterial.map = secondaryTexture;
      secondaryMaterial.needsUpdate = true;
    }
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
    this.secondaryObject3d.material.dispose();
  }
}
