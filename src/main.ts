import './style.css';
import { OceanApp } from './core/OceanApp';
import { createCrosshair } from './ui/createCrosshair';

const container = document.querySelector<HTMLElement>('#app');

if (!container) {
  throw new Error('找不到 3D 場景容器。');
}

const ocean = new OceanApp(container);
createCrosshair();
ocean.start();
