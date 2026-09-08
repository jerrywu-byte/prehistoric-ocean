# v0.5.4 Directional stress fixture

鄧氏魚 / Dunkleosteus is a temporary elongated-body test species, not final content.
It uses the existing Creature, TextureLoader, temporal fade, heading convention,
camera-facing billboard, fallback and disposal. No ammonite configuration or PNG changed.

## Replace the temporary artwork

All eight shipped PNGs are procedural Canvas 2D placeholders, visibly labelled
`DUNKLEOSTEUS — PLACEHOLDER`. They demonstrate asset integration only; their
schematic projection is not evidence for the final renderer's visual quality.
Replace them in `public/assets/creatures/dunkleosteus/` with consistent transparent PNGs:

| View | Filename |
| --- | --- |
| FRONT | dunkleosteus_mid_front.png |
| FRONT_RIGHT | dunkleosteus_mid_front_right.png |
| RIGHT | dunkleosteus_mid_right.png |
| BACK_RIGHT | dunkleosteus_mid_back_right.png |
| BACK | dunkleosteus_mid_back.png |
| BACK_LEFT | dunkleosteus_mid_back_left.png |
| LEFT | dunkleosteus_mid_left.png |
| FRONT_LEFT | dunkleosteus_mid_front_left.png |

Use consistent canvas dimensions, framing, scale and identity across views.
The current temporary canvas is 768 × 384; the plane is 4.8 × 2.4 world units.
No TOP/BOTTOM files are loaded. Build and startup never regenerate assets.
`scripts/createDunkleosteusPlaceholders.cjs` is an explicitly invoked development
utility requiring `@napi-rs/canvas`; it is not a project runtime dependency.
Do not run it after supplying final PNGs, since it overwrites these eight fixtures.

## Observation setup

Home: `(7, 3.2, -6)`. Ammonite remains at `(0, 3.2, 2)`.
Roam radius: 3.5; cruise speed: 0.22; turn rate: 18°/s.
Temporal fade: the existing 140 ms / 4° hysteresis, unchanged.
Move right and forward from spawn to approach the fish. Debug follows the
creature closest to the crosshair within 20°, falling back to the nearest creature.
Proximity still follows the nearest creature. No extra selection UI was added.

After replacing the placeholders, observe for 30–60 seconds in Windows Chrome,
including front → diagonal → side and side → rear diagonal → back transitions.
Record slicing, body-length jumps, tail displacement, abrupt head changes,
whether the 140 ms fade masks the 45° view change, and comparison with ammonite.
Real Windows Chrome acceptance has not been performed here. Do not interpret
unit tests or placeholder images as that acceptance. This version does not tune
the renderer in response to visual findings.
