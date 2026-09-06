import * as THREE from 'three';
import { DiverControls } from '../controls/DiverControls';
import { CreatureManager, type CreatureProximityState } from '../creatures/CreatureManager';
import { PROTOTYPE_CREATURE } from '../creatures/creatureConfig';
import { createOceanEnvironment } from '../world/createOceanEnvironment';

export class OceanApp {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly diverControls: DiverControls;
  private creatureManager: CreatureManager | null = null;

  constructor(
    private readonly container: HTMLElement,
    onPointerLockChange: (isLocked: boolean) => void,
    onCreatureProximityChange: (state: CreatureProximityState) => void,
  ) {
    this.scene.background = new THREE.Color(0x031824);
    this.scene.fog = new THREE.FogExp2(0x062536, 0.025);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    );
    this.camera.position.set(0, 3.2, 10);
    this.camera.lookAt(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    createOceanEnvironment(this.scene);
    this.diverControls = new DiverControls(
      this.camera,
      this.renderer.domElement,
      onPointerLockChange,
    );
    this.initializeCreatureManager(onCreatureProximityChange);
    window.addEventListener('resize', this.handleResize);
  }

  start(): void {
    this.renderer.setAnimationLoop(this.animate);
  }

  private readonly animate = (): void => {
    const deltaSeconds = Math.min(this.clock.getDelta(), 0.05);
    this.diverControls.update(deltaSeconds);
    this.updateCreatures(deltaSeconds);
    this.renderer.render(this.scene, this.camera);
  };

  private initializeCreatureManager(
    onCreatureProximityChange: (state: CreatureProximityState) => void,
  ): void {
    try {
      this.creatureManager = new CreatureManager(
        this.scene,
        this.camera,
        PROTOTYPE_CREATURE,
        onCreatureProximityChange,
      );
    } catch (error) {
      this.disableCreatureSystem('initialization', error);
    }
  }

  private updateCreatures(deltaSeconds: number): void {
    if (!this.creatureManager) {
      return;
    }

    try {
      this.creatureManager.update(deltaSeconds);
    } catch (error) {
      this.disableCreatureSystem('update', error);
    }
  }

  private disableCreatureSystem(phase: 'initialization' | 'update', error: unknown): void {
    console.error(`[CreatureManager] ${phase} failed; diver controls remain active.`, error);

    try {
      this.creatureManager?.dispose();
    } catch (disposeError) {
      console.error('[CreatureManager] cleanup failed.', disposeError);
    }

    this.creatureManager = null;
  }

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
