import './style.css';
import { OceanApp } from './core/OceanApp';
import { createControlsHint } from './ui/createControlsHint';
import { createCreatureInfo } from './ui/createCreatureInfo';
import { createCrosshair } from './ui/createCrosshair';

const container = document.querySelector<HTMLElement>('#app');

if (!container) {
  throw new Error('找不到 3D 場景容器。');
}

const controlsHint = createControlsHint();
const creatureInfo = createCreatureInfo();
const ocean = new OceanApp(
  container,
  controlsHint.setExploring,
  creatureInfo.setProximity,
);
createCrosshair();
ocean.start();
