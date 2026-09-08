# Species framework (v0.4.0)

Species definitions describe a kind of creature; spawn configs describe one placed instance.
Creature holds the registry's shared, readonly definition reference, never a copied definition.

- `src/species/SpeciesDefinition.ts`: names, scientific name, rendering discriminator,
  asset provider, default dimensions, orientation, interaction, capability metadata and behavior profile.
- `src/species/ammonite/`: ammonite definition, standard asset provider and PNG loader (with the previous Canvas drawing retained but inactive).
- `src/species/speciesRegistry.ts`: register definitions once; lookup rejects unknown IDs and duplicates.
- `src/creatures/CreatureSpawnConfig.ts`: instance ID, species ID, position, optional heading,
  scale override/multiplier and optional deterministic ambient-motion phase.
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
Active locomotion and animation remain disabled, one frame per direction; gentle_drifter is metadata only.
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

## v0.5.0 ambient life motion

Movement capability now separates optional ambient motion from future active locomotion.
Ammonite keeps active movement disabled and enables a species-owned ambient profile: vertical
amplitude 0.16 over 5.5 seconds, X drift 0.14 over 8 seconds and Z drift 0.10 over 6.7 seconds.
The differing periods and phase multipliers avoid a simple circular track.

Each Creature preserves its spawn position as a readonly home anchor. Every update recomputes
the display position as anchor plus a pure sinusoidal offset; offsets never accumulate.
An explicit spawn motionPhase is used when present. Otherwise a stable FNV-1a hash of the
instance ID produces a reproducible phase, so future instances need not move in sync.
Scale, heading and roll are not animated.

The displayed position is constrained to the existing world bounds and to one scaled half-height
above the analytical seabed. Directional and pitch-layer selection, distance and proximity all use
that final displayed position rather than the anchor. The calculations reuse vectors owned by the
Creature and do not allocate objects in the per-frame path. Debug exposes the anchor, applied
motion offset, current position and vertical bob. This remains ambient display motion only; no
swimming, steering, behavior AI or spawn mutation is implemented.

## v0.5.1 gentle horizontal roaming

Movement capability now contains a locomotion discriminator alongside ambientMotion.
Ammonite enables gentle_roam with a 3.5-unit home radius, 0.26 units/second cruise speed,
0.16 acceleration, 0.22 deceleration, a 0.9 slowdown radius and 0.18 arrival radius.
It turns at no more than 24 degrees/second. Target points must be at least 1.2 units from
the previous position; arrival pauses are deterministically selected from 1.2–2.8 seconds.

Creature position is explicitly split into the immutable spawn home, a locomotion base
position, and the independent ambient offset. The rendered position is recomputed from
locomotion plus ambient on every frame before the existing world/seabed safety clamp.
Locomotion changes X/Z only; Y remains the home base. Scale and roll are untouched.

gentleRoam owns a seeded PRNG derived from species ID and instance ID (or an explicit spawn
seed). Candidate waypoints use varying angles and area-weighted radii inside the home circle,
reject near/out-of-bounds candidates, and have a deterministic bounded fallback. No Math.random
or fixed polygon/circular route is used. MOVING applies delta-time speed and shortest-arc heading
turns; PAUSED keeps locomotion fixed while ambient motion continues.

Desired speed decreases inside the slowdown radius and with heading error. Full speed is allowed
within 25 degrees, reduced through 60 degrees, and reaches zero above 100 degrees so the creature
turns before translating instead of visibly side-slipping. Horizontal Sprite view continues to use
camera position relative to the now-current heading; pitch layer, proximity and billboard orientation
use the final current rendered position. Debug groups rendering, ambient and locomotion state.

## v0.5.2 horizontal directional crossfade

Species rendering now owns horizontalDirectionBlend configuration. Ammonite enables a 16-degree
window around each 45-degree horizontal sector boundary. Outside the window only the nearest view
is rendered. Inside it, a pure angle selector returns the two adjacent views and a smoothstep blend;
the boundary center is 50/50. Angle wrapping uses the existing directional convention, including
the BACK boundary around ±180 degrees.

Crossfade-enabled species use continuous relative horizontal angle instead of the legacy 5-degree
direction hysteresis, preventing a held view followed by a hard switch. The old hysteresis path is
retained for species with blending disabled. Pitch-layer selection and its hysteresis remain separate:
both horizontal maps are always selected from the same current TOP, MID or BOTTOM layer.

Creature keeps its existing mesh as the primary plane and owns one child mesh as the secondary plane.
They share geometry and world transform, so position, scale, camera-facing pitch/yaw and zero roll are
identical. Primary opacity is 1 - blend and secondary opacity is blend. The secondary is hidden outside
the blend window. Both texture materials keep depthWrite disabled and use fixed render orders 10/11,
which provides deterministic composition without a positional offset or z-fighting. Maps change only
when a view or pitch layer changes; opacity alone updates through the normal material uniform.

Fallback remains a single visible orange primary plane. Texture ownership is unchanged: all 24 maps
are still loaded once and disposed once, while both mesh materials are disposed with the Creature.
Debug reports primary/secondary view, blend value, boundary and continuous relative horizontal angle.
