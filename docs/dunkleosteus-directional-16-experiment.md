# v0.5.5 Dunkleosteus directional-16 experiment

This experiment changes only Dunkleosteus from eight to sixteen horizontal views.
Ammonite remains `pitch_directional_8x3`. Creature still owns the shared camera-facing
billboard, heading-relative selection, two-plane temporal transition and disposal.

## A/B development flag

`DUNKLEOSTEUS_DIRECTIONAL_MODE` in
`src/species/dunkleosteus/dunkleosteusAssets.ts` is the single development flag:

- `directional_16`: 22.5° sectors, 110 ms fade, 2.5° hysteresis.
- `directional_8`: 45° sectors, 140 ms fade, 4° hysteresis.

It is currently set to `directional_16`. This is not a user-facing setting.

## Missing intermediate artwork

Place these transparent PNGs in `public/assets/creatures/dunkleosteus/`:

- `dunkleosteus_mid_front_front_right.png`
- `dunkleosteus_mid_right_front.png`
- `dunkleosteus_mid_right_back.png`
- `dunkleosteus_mid_back_back_right.png`
- `dunkleosteus_mid_back_back_left.png`
- `dunkleosteus_mid_left_back.png`
- `dunkleosteus_mid_left_front.png`
- `dunkleosteus_mid_front_front_left.png`

Until supplied, each missing intermediate view aliases a neighboring existing texture.
The eight missing keys appear in Debug; the creature remains visible and animated.
A missing original eight-direction image remains a hard asset error and preserves the
orange material fallback. No image is generated, renamed, cropped or overwritten here.

After supplying the images, compare both modes for at least 60 seconds in Windows
Chrome. Focus on body length, head and tail continuity near BACK, and confirm each
110 ms transition collapses without a residual second plane.
