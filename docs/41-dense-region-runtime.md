# Dense Region Runtime

Issue: https://github.com/seazhu831/findscape-cocos/issues/75

Stage 4G integrates `findscape_dense_region_batch_v1` as the first authored
dense scene slice. The accepted batch is preserved unchanged under
`design/claude-design/intake/20260722-dense-region`; normalized source copies
live under `design/claude-design/source/dense_lower_garden`, and runtime PNGs
live under `cocos/assets/resources/art/dense/lower_garden`.

## Runtime Composition

The slice adds four static decoration clusters, two six-frame ambient actors,
and three foreground occluders. Puppy and gem occluders declare
`activationTargetEntityIds`, so they activate only when the selected mode
projects the linked target. Persistent garden clutter and actors remain active
across modes.

`design/claude-design/dense-region-asset-manifest.json` is the normalized
source-to-runtime contract. `npm run check:dense-assets` verifies source and
runtime hashes, RGBA transparency, dimensions, frame coverage, stable actor
baselines, entity transforms, motion frame paths, and concealment bindings.

## Intake Normalization

- All 19 delivered PNG hashes match the source manifest.
- Both actor sequences have a measured stable baseline at y=455; the delivered
  manifest declared y=450.
- Runtime transforms compensate for transparent source canvases by scaling
  static clusters and actors to 0.52 and the lane shrub to 0.55.
- The gem basket keeps the design preview scale of 0.45.
- The puppy planter is scaled to 0.38 and shifted to `(410, 1905)` after runtime
  inspection showed that the initial composition exposed only the puppy's feet.

These are runtime-only transforms. The accepted source exports remain intact.

## Acceptance

The Web Mobile build was exercised at 390x844 in Hidden Object and Balloon
Blast modes:

- static clusters and actors read as environment detail at default zoom;
- both six-frame actor loops produced distinct rendered frames without blanks;
- magnifier focus and automatic restore remained functional;
- puppy and gem occluders appeared only with their linked Hidden Object targets;
- the puppy face and one ear remained discoverable and the covered target was
  tappable through the non-interactive foreground layer;
- the gem retained stronger basket-and-blue-glass camouflage;
- the collapsible target strip exposed the lower search region when collapsed.

Creator 3.8.8 completed the Web Mobile build successfully with its known CLI
exit code 36. Stage 4H owns region activation, diagnostics, pooling, and
physical-device budgets.
