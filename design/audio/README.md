# Runtime Feedback Audio

The first runtime SFX batch uses Kenney's **Interface Sounds** pack. The pack is
released under CC0 1.0, so registration, payment, and attribution are not
required. Source details are kept here even though attribution is optional.

## Source

- Provider: Kenney
- Pack: Interface Sounds 1.0
- Pack page: https://kenney.nl/assets/interface-sounds
- Download archive: https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip
- License: CC0 1.0 Universal
- License URL: https://creativecommons.org/publicdomain/zero/1.0/
- Downloaded: 2026-07-15

## Runtime Mapping

| Feedback | Runtime resource | Source file | Duration | Format |
| --- | --- | --- | ---: | --- |
| Find success | `audio/sfx_find_success` | `confirmation_002.ogg` | 0.539 s | OGG Vorbis, mono, 44.1 kHz |
| Balloon pop | `audio/sfx_pop_success` | `pluck_001.ogg` | 0.102 s | OGG Vorbis, stereo, 44.1 kHz |
| Catch success | `audio/sfx_catch_success` | `confirmation_004.ogg` | 0.490 s | OGG Vorbis, mono, 44.1 kHz |
| Hint reveal | `audio/sfx_hint_reveal` | `question_001.ogg` | 0.491 s | OGG Vorbis, mono, 44.1 kHz |
| Wrong tap | `audio/sfx_wrong_tap` | `error_003.ogg` | 0.533 s | OGG Vorbis, stereo, 44.1 kHz |

The files are already compact, short feedback clips. They are retained in their
original encoding to avoid a lossy transcode. Runtime playback and volume tuning
are tracked separately from this asset-intake batch.
