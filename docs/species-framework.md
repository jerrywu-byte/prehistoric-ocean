# Species framework (v0.4.0)

Species definitions describe a kind of creature; spawn configs describe one placed instance.
Creature holds the registry's shared, readonly definition reference, never a copied definition.

- `src/species/SpeciesDefinition.ts`: names, scientific name, rendering discriminator,
  asset provider, default dimensions, orientation, interaction, capability metadata and behavior profile.
- `src/species/ammonite/`: ammonite definition, standard asset provider and PNG loader (with the previous Canvas drawing retained but inactive).
- `src/species/speciesRegistry.ts`: register definitions once; lookup rejects unknown IDs and duplicates.
- `src/creatures/CreatureSpawnConfig.ts`: instance ID, species ID, position, optional heading,
  scale override and multiplier. Reserved instance state has no behavior implementation.
- `src/world/creatureSpawns.ts`: the single scene spawn at (0, 3.2, 2).

To add a species later, supply a definition and asset provider, register it, then pass
its species ID to `CreatureManager.spawnCreature(config)`. Creature needs no species-specific import.
Only ammonite is registered/spawned in this phase.

Providers return a `DirectionalTextureSet` synchronously or by Promise. Keys are shared:
front, frontRight, right, backRight, back, backLeft, left, frontLeft.
Each load transfers ownership of a fresh set to the instance; textures must use SRGB color space.
Creature reuses maps until direction changes and disposes every unique texture once, including
assets that finish loading after disposal. Manager owns the shared plane geometry.
Loading or failure keeps an orange fallback; provider errors are logged and exposed in Debug.

Ammonite uses eight PNG assets under public/assets/creatures/ammonite/, 3.2 × 2 dimensions, heading 90° (+Z),
5° hysteresis, interaction distance 6 and minimum observation distance 2.25.
Movement/animation remain disabled, one frame per direction; gentle_drifter is metadata only.
Position belongs to the spawn, not the species. An omitted heading uses the species default.
Scale override replaces dimensions; the multiplier applies afterwards (default 1).
No AI, movement or animation runners are implemented.

Tests cover direction order and boundaries, materials, proximity, registry and shared definitions,
instance transforms, synchronous/asynchronous fallback, and asset disposal.
These program tests do not replace Windows Chrome visual/control acceptance.


## v0.4.1 PNG integration

Ammonite's provider uses TextureLoader with an explicit mapping of all eight standard
direction keys to ammonite_*.png. Relative URLs support the existing Vite base './'.
Only a complete successful set is returned. Any failed request rejects the provider
after every request settles and disposes all allocated textures; Creature keeps fallback.
The extra candidate image is not part of the mapping.
SRGB is applied on load. Species material settings, core Creature, registry, direction
selection, hysteresis, spawn and diver controls are unchanged.
