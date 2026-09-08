import { DIRECTIONAL_LABELS } from './directional/types';
import * as THREE from 'three';
import { Creature } from './Creature';
import type { CreatureSpawnConfig } from './CreatureSpawnConfig';
import { speciesRegistry, type SpeciesRegistry } from '../species/speciesRegistry';

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
  readonly speciesId?: string;
  readonly creatureName?: string;
  readonly view?: string;
  readonly secondaryView?: string;
  readonly horizontalBlend?: number;
  readonly horizontalTarget?: string;
  readonly transitionActive?: boolean;
  readonly transitionProgress?: number;
  readonly transitionSource?: string;
  readonly primaryOpacity?: number;
  readonly secondaryOpacity?: number;
  readonly previousView?: string;
  readonly directionIndex?: number;
  readonly hysteresisDegrees?: number;
  readonly relativeAngle?: number;
  readonly heading?: number;
  readonly distance?: number;
  readonly observation?: 'NORMAL' | 'TOO CLOSE';
  readonly textureMode?: string;
  readonly verticalAngle?: number;
  readonly targetPitch?: number;
  readonly appliedPitch?: number;
  readonly pitchLimit?: number;
  readonly pitchDeadZone?: number;
  readonly billboardMode?: string;
  readonly pitchLayer?: string;
  readonly pitchThreshold?: number;
  readonly pitchHysteresis?: number;
  readonly textureKey?: string;
  readonly ambientMotionEnabled?: boolean;
  readonly anchorX?: number;
  readonly anchorY?: number;
  readonly anchorZ?: number;
  readonly motionOffsetX?: number;
  readonly motionOffsetY?: number;
  readonly motionOffsetZ?: number;
  readonly locomotionState?: 'MOVING' | 'PAUSED' | 'OFF';
  readonly locomotionX?: number;
  readonly locomotionY?: number;
  readonly locomotionZ?: number;
  readonly targetX?: number;
  readonly targetZ?: number;
  readonly distanceToTarget?: number;
  readonly speed?: number;
  readonly targetHeading?: number;
  readonly headingDelta?: number;
  readonly roamRadius?: number;
  readonly pauseRemaining?: number;
}

export class CreatureManager {
  private readonly creatures: Creature[] = [];
  private readonly geometry = new THREE.PlaneGeometry(1, 1);
  private wasNearby = false;
  private nearbyCreature: Creature | null = null;
  private disposed = false;
  private debugElapsed = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly onProximityChange: (state: CreatureProximityState) => void,
    private readonly onDebugChange: (state: CreatureDebugState) => void,
    private readonly registry: SpeciesRegistry = speciesRegistry,
  ) {}

  spawnCreature(spawn: CreatureSpawnConfig): Creature {
    if (this.disposed) throw new Error('CreatureManager has been disposed');
    if (this.creatures.some(creature => creature.spawn.id === spawn.id)) {
      throw new Error('Duplicate creature instance: ' + spawn.id);
    }
    const creature = new Creature(this.registry.getSpeciesById(spawn.speciesId), spawn, this.geometry);
    this.creatures.push(creature);
    this.scene.add(creature.object3d);
    creature.update(0, this.camera);
    this.reportDebugState(creature);
    creature.initializeAssets(() => this.reportDebugState(creature));
    return creature;
  }

  update(deltaSeconds: number): void {
    for (const creature of this.creatures) creature.update(deltaSeconds, this.camera);
    let creature: Creature | undefined;
    let nearestDistance = Infinity;
    for (const candidate of this.creatures) {
      const distance = candidate.distanceSquaredTo(this.camera.position);
      if (distance < nearestDistance) { nearestDistance = distance; creature = candidate; }
    }
    if (!creature) return;
    this.debugElapsed += deltaSeconds;
    if (this.debugElapsed >= 0.1) {
      this.debugElapsed = 0;
      this.reportDebugState(creature);
    }
    const isNearby = creature.distanceSquaredTo(this.camera.position) <= creature.species.interaction.interactionDistance ** 2;
    if (isNearby !== this.wasNearby || (isNearby && this.nearbyCreature !== creature)) {
      this.wasNearby = isNearby;
      this.nearbyCreature = isNearby ? creature : null;
      this.onProximityChange({
        isNearby, name: creature.species.name.zhTW, subtitle: creature.species.name.en,
      });
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const creature of this.creatures) {
      this.scene.remove(creature.object3d);
      creature.dispose();
    }
    this.creatures.length = 0;
    this.geometry.dispose();
  }

  private reportDebugState(creature: Creature): void {
    if (!creature) return;
    const species = creature.species;
    this.onDebugChange({
      count: this.creatures.length,
      visible: creature.object3d.visible,
      x: creature.object3d.position.x, y: creature.object3d.position.y, z: creature.object3d.position.z,
      textureStatus: creature.textureStatus,
      textureUrl: species.directionalAssets.id,
      speciesId: species.id,
      creatureName: species.name.zhTW + ' / ' + species.name.en,
      view: creature.view ? DIRECTIONAL_LABELS[creature.view] : '—',
      secondaryView: creature.secondaryDirectionalView
        ? DIRECTIONAL_LABELS[creature.secondaryDirectionalView]
        : 'NONE',
      horizontalBlend: creature.horizontalBlend,
      horizontalTarget: DIRECTIONAL_LABELS[creature.horizontalTransition.target],
      transitionActive: creature.horizontalTransition.active,
      transitionProgress: creature.horizontalTransition.progress,
      transitionSource: creature.horizontalTransition.source ? DIRECTIONAL_LABELS[creature.horizontalTransition.source] : 'NONE',
      primaryOpacity: creature.object3d.material.opacity,
      secondaryOpacity: creature.secondaryObject3d.material.opacity,
      previousView: creature.previousDirectionalView ? DIRECTIONAL_LABELS[creature.previousDirectionalView] : '—',
      directionIndex: creature.directionIndex,
      hysteresisDegrees: species.rendering.horizontalDirectionTransition.enabled
        ? species.rendering.horizontalDirectionTransition.hysteresisDegrees
        : species.orientation.directionalHysteresisDegrees,
      relativeAngle: creature.relativeAngle * 180 / Math.PI,
      heading: creature.headingRadians * 180 / Math.PI,
      verticalAngle: THREE.MathUtils.radToDeg(creature.verticalAngle),
      targetPitch: THREE.MathUtils.radToDeg(creature.targetPitch),
      appliedPitch: THREE.MathUtils.radToDeg(creature.appliedPitch),
      pitchLimit: species.orientation.maxBillboardPitchDegrees,
      pitchDeadZone: species.orientation.billboardPitchDeadZoneDegrees,
      billboardMode: species.rendering.billboard === 'cameraFacing' ? 'CAMERA_FACING' : species.rendering.billboard === 'constrainedPitch' ? 'YAW + LIMITED_PITCH' : 'YAW',
      distance: creature.distance,
      observation: creature.distance < species.interaction.minimumObservationDistance ? 'TOO CLOSE' : 'NORMAL',
      textureMode: species.rendering.mode.toUpperCase(),
      pitchLayer: creature.currentPitchLayer?.toUpperCase(),
      pitchThreshold: species.orientation.pitchLayerThresholdDegrees,
      pitchHysteresis: species.orientation.pitchLayerHysteresisDegrees,
      textureKey: (creature.currentPitchLayer ? creature.currentPitchLayer.toUpperCase() + '_' : '')
        + DIRECTIONAL_LABELS[creature.view ?? 'front'],
      ambientMotionEnabled: species.movement.ambientMotion.enabled,
      anchorX: creature.anchorPosition.x,
      anchorY: creature.anchorPosition.y,
      anchorZ: creature.anchorPosition.z,
      motionOffsetX: creature.motionOffset.x,
      motionOffsetY: creature.motionOffset.y,
      motionOffsetZ: creature.motionOffset.z,
      locomotionState: creature.locomotion?.state ?? 'OFF',
      locomotionX: creature.locomotionPosition.x,
      locomotionY: creature.locomotionPosition.y,
      locomotionZ: creature.locomotionPosition.z,
      targetX: creature.locomotion?.target.x,
      targetZ: creature.locomotion?.target.z,
      distanceToTarget: creature.locomotion?.distanceToTarget,
      speed: creature.locomotion?.speed,
      targetHeading: creature.locomotion
        ? THREE.MathUtils.radToDeg(creature.locomotion.targetHeadingRadians)
        : undefined,
      headingDelta: creature.locomotion
        ? THREE.MathUtils.radToDeg(creature.locomotion.headingDeltaRadians)
        : undefined,
      roamRadius: creature.locomotion?.config.horizontalRoamRadius,
      pauseRemaining: creature.locomotion?.pauseRemainingSeconds,
      materialMode: creature.object3d.material.map ? 'TEXTURE' : 'FALLBACK',
    });
  }
}
