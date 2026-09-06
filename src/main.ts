import './style.css';
import { OceanApp } from './core/OceanApp';
import { createControlsHint } from './ui/createControlsHint';
import { createCreatureInfo } from './ui/createCreatureInfo';
import { createCrosshair } from './ui/createCrosshair';
import { createPointerLockDebug } from './ui/createPointerLockDebug';

const container = document.querySelector<HTMLElement>('#app');

if (!container) {
  throw new Error('找不到 3D 場景容器。');
}

const controlsHint = createControlsHint();
const creatureInfo = createCreatureInfo();
const pointerLockDebug = createPointerLockDebug();
const ocean = new OceanApp(
  container,
  controlsHint.startButton,
  (isLocked) => {
    controlsHint.setExploring(isLocked);
    pointerLockDebug.setLocked(isLocked);
  },
  pointerLockDebug.setCanvasClicked,
  pointerLockDebug.setError,
  pointerLockDebug.setCameraPosition,
  creatureInfo.setProximity,
  pointerLockDebug.setCreatureState,
);
createCrosshair();
ocean.start();
