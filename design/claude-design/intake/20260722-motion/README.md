# Findscape Motion Batch v1

Two seamless idle frame sets for the portrait demo, per issue #71 handoff.

- 512x512 RGBA PNG per frame, transparent background, native scale of the
  supplied static references (included as reference_static.png in each set).
- 8 fps, seamless loop, anchor {x:0.5,y:0.5}. frame_00 equals the static
  reference, so switching static->animated does not jump.
- thief_idle: breathing (vertical scale about foot baseline y=455, max +1.6%)
  + left/right pupil glance (+/-4.5px). Feet planted; no translation.
- puppy_idle: tail wag (+/-10.5deg about the tail root behind the body) + one
  subtle blink (frames 03-05). Paw baseline y=442 stable; no translation.
- No shadows, reactions, props, atlas, or .anim files (out of scope).

See manifest.json for the adapter contract; contact_sheet.png shows both
loops in frame order at native size.
