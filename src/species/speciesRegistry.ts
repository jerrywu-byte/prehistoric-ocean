import type { CreatureSpeciesDefinition } from './SpeciesDefinition';
import { ammoniteSpecies } from './ammonite/ammoniteSpecies';

export class SpeciesRegistry {
  private readonly definitions = new Map<string, CreatureSpeciesDefinition>();
  constructor(definitions: readonly CreatureSpeciesDefinition[]) {
    for (const definition of definitions) {
      if (this.definitions.has(definition.id)) throw new Error('Duplicate species: ' + definition.id);
      this.definitions.set(definition.id, definition);
    }
  }

  listAvailableSpecies(): readonly CreatureSpeciesDefinition[] {
    return [...this.definitions.values()];
  }

  getSpeciesById(id: string): CreatureSpeciesDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error('Unknown species: ' + id);
    return definition; // Shared definition reference; never copied into a spawn.
  }
}

export const speciesRegistry = new SpeciesRegistry([ammoniteSpecies]);

export const getSpeciesById = (id: string): CreatureSpeciesDefinition => speciesRegistry.getSpeciesById(id);
export const listAvailableSpecies = (): readonly CreatureSpeciesDefinition[] => speciesRegistry.listAvailableSpecies();
