import type { CreatureSpawnConfig } from '../creatures/CreatureSpawnConfig';

export const AMMONITE_SPAWN: CreatureSpawnConfig = {
  id: 'ammonite-001',
  speciesId: 'ammonite',
  position: [0, 3.2, 2],
  headingDegrees: 90,
  motionPhase: 0,
};

export const DUNKLEOSTEUS_SPAWN: CreatureSpawnConfig = {
  id: 'dunkleosteus-stress-001',
  speciesId: 'dunkleosteus',
  // Separate home areas; neither species needs collision avoidance for this test.
  position: [7, 3.2, -6],
  headingDegrees: 90,
  motionPhase: 1.3,
};
