# Decision Note — findscape_dense_region_batch_v1

## Position deviations (all within the allowed 40 px)
- garden_planter_cluster: (410,1935) -> (395,1925). Pulled 15 px left/up so the
  watering can clears the existing bench and the cluster reads separate from
  the puppy occluder.
- garden_blue_glass_cluster: (1080,2170) -> (1065,2130). Raised off the toy-pit
  ellipse and clear of the seated reader.
- occluder_puppy_planter: (480,1995) -> (444,2003). Tuned by pixel measurement
  to hit the 55% visible target (measured 55.0%).
- occluder_gem_flower_basket: (1200,2105) -> (1236,2105). Tuned by pixel
  measurement toward 42% visible (measured 41.1%).
- occluder_lane_shrub: (700,2190) -> (740,2190). Shifted right so the base-map
  tree stays partly readable behind the shrub.

## Scale assumption
Targets are composited at 0.45 of their 512 px reference canvases
(subject ~150 map px, matching prior batch composites). Concealment ratios
were measured programmatically at these positions/scales; if the runtime uses
a different target scale, re-tune occluder positions, not the art.

## Other decisions
- actor_gardener_kneeling sits at the lane junction shoulder tending a
  trailside sprout; knees, plant, and ground contact are fixed across frames,
  breathing/hand motion only (parametric redraw, every frame complete).
- actor_reader_seated: breathing plus page-corner lift; seated base fixed.
- garden_blue_glass_cluster uses only round pebbles and a bottle — blue/sparkle
  color decoy without echoing the gem's faceted teardrop silhouette.
- No shadows baked beyond the object-level style used by existing map props;
  no text, labels, or checkerboard in any runtime PNG.
