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

## v0.4.2 constrained pitch

Ammonite rendering.billboard is constrainedPitch; cylindrical remains available.
Orientation adds maxBillboardPitchDegrees (30), billboardPitchDeadZoneDegrees (3),
billboardPitchResponseSeconds (0.18, time to 95% response) and
billboardHorizontalEpsilon (0.01 world units).

Creature computes atan2(camera.y - creature.y, hypot(dx,dz)) from positions only.
Pitch inside the dead zone targets zero; outside it targets the angle clamped to ±30°.
Exponential damping is frame-rate independent and does not overshoot.
At the vertical pole (horizontal distance below epsilon), target pitch, yaw and
directional view retain their preceding values; current pitch continues smoothing.
TOO CLOSE still uses the original full 3D distance and 2.25 threshold.

Orientation uses Euler YXZ (RY × RX), with zero Z rotation. Positive semantic pitch
means upward; Euler X is negative to tilt the +Z plane normal upward. Pitch acts around
the yawed local horizontal axis. It does not copy camera rotation or change horizontal
view selection, heading, textures or world position. No objects are allocated per update.

Debug adds vertical angle, target/applied pitch, pitch limit, dead zone and billboard mode.
Program tests verify normal direction at every yaw, level/up/down, clamping, dead zone,
frame-rate independence and pole safety. Windows Chrome must still verify the visual result.

## v0.4.3 pitch-aware assets (current ammonite configuration)

Rendering now supports pitch_directional_8x3 in addition to directional_8.
The existing directional_8 provider shape and cylindrical/constrainedPitch modes remain supported.
Ammonite uses cameraFacing and a PitchDirectionalTextureSet:
top, mid and bottom each contain the same eight shared horizontal keys.
The provider loads ammonite_{layer}_{direction}.png exactly once per instance.
All 24 requests must succeed; partial/failing sets are disposed and leave orange fallback.
Successful sets, including sets delivered after instance disposal, release every texture once.

PitchLayer keys are top/mid/bottom; Debug displays uppercase. getPitchLayer is a pure
degree-based selector. Initial selection uses ±20°. Subsequent entry from MID requires
greater than +25° or less than -25°; return requires less than +15° or greater than -15°.
Equality retains the current layer. Direct TOP/BOTTOM jumps are supported for large position changes.
pitchLayerThresholdDegrees and pitchLayerHysteresisDegrees are species orientation fields.

Horizontal math/hysteresis is unchanged. Pitch layers use the actual position-derived vertical angle,
not the damped plane pitch. At the vertical pole, horizontal view/yaw retain their last values
(default FRONT before any horizontal observation), but the layer still selects TOP/BOTTOM.
Camera-facing orientation uses position-derived yaw/elevation with YXZ Euler order and zero roll.
It ignores camera rotation and does not apply the old 30° limit or pitch smoothing.
ConstrainedPitch and its config/functions/tests remain available for other definitions.

The 24 supplied PNGs are square; ammonite dimensions are now 3.2 × 3.2 (previously 3.2 × 2)
to preserve aspect ratio. Spawn position, heading, material, proximity and controls are unchanged.
Map assignment occurs only when the selected texture changes. Update creates no texture,
material, vector or temporary object. No animation, motion, crossfade or extra species is added.

Debug shows rendering mode, horizontal view, pitch layer, vertical angle, threshold,
hysteresis, texture key and READY/ERROR/FALLBACK. Limited-pitch fields are hidden for this mode.
Node tests use image-event adapters; PNG decode/build-copy checks are separate.
Program validation does not constitute Windows Chrome visual acceptance.
