import * as THREE from 'three';
import { getSeabedHeightAt, WORLD_LIMITS } from './worldLimits';

export function createOceanEnvironment(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0x5f9fb3, 0.8);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0x79c8df, 0x102028, 1.8);
  scene.add(hemisphereLight);

  const surfaceLight = new THREE.DirectionalLight(0x8dd9e8, 1.4);
  surfaceLight.position.set(-8, 18, 6);
  scene.add(surfaceLight);

  const seabedGeometry = new THREE.PlaneGeometry(160, 160, 32, 32);
  const positions = seabedGeometry.attributes.position;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const worldHeight = getSeabedHeightAt(x, -y);
    positions.setZ(index, worldHeight - WORLD_LIMITS.seabedBaseY);
  }

  seabedGeometry.computeVertexNormals();

  const seabedMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d4748,
    roughness: 1,
    metalness: 0,
  });
  const seabed = new THREE.Mesh(seabedGeometry, seabedMaterial);
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.y = WORLD_LIMITS.seabedBaseY;
  scene.add(seabed);
}
