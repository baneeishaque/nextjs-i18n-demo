# YouTube kit

A scripted, reproducible pipeline that produces the project video in six languages: one
~1.5–2.5 minute narrated video per locale plus a master MKV carrying every language as an
audio and subtitle track.

## What exists here

| File / directory       | Role                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `scenes.json`          | **Single source of truth**: per-scene code line, slide title, and narration in all six languages |
| `render-slides.mjs`    | Renders 1920×1080 slide PNGs with headless Chromium                        |
| `build-video.py`       | Orchestrates TTS, subtitles, docs, slides, videos, and the master MKV       |
| `script.md`            | Human-readable narration script (generated — edit the JSON, not this file)  |
| `storyboard.md`        | Scene-by-scene timing table (generated)                                    |
| `subtitles/*.srt` / `*.vtt` | Upload-ready subtitles per locale (committed deliverables)            |
| `metadata.md`          | YouTube titles, descriptions, chapters, and tags per locale                |
| `build/`               | All generated media (git-ignored): audio, slides, segments, videos          |

## Voices

| Locale | macOS voice | Notes                                        |
| ------ | ----------- | -------------------------------------------- |
| `en`   | Aman        | en_IN                                        |
| `hi`   | Lekha       | hi_IN                                        |
| `ta`   | Vani        | ta_IN                                        |
| `kn`   | Soumya      | kn_IN                                        |
| `ar`   | Majed       | ar_001                                       |
| `ml`   | —           | **No Malayalam voice ships with macOS**      |

**The Malayalam gap:** rather than shipping Hindi audio mislabeled as Malayalam, the pipeline
skips `ml` narration with a warning and still produces the Malayalam slides, subtitles, and a
silent video. To fill the gap, either record a human narrator (preferred — the script is in
`script.md`) or synthesize with a cloud provider, then save the result as
`build/audio/ml/<NN>-<scene>.wav` (48 kHz stereo) and re-run `--videos --master`. Any provider
works: Google Cloud TTS, Azure Speech, ElevenLabs.

## Requirements

- macOS (`say`) — the only platform-specific stage; everything else is portable
- `ffmpeg` and `ffprobe` on PATH
- Node.js with the repository's dev dependencies installed (for Playwright's Chromium)

## Running

```bash
python3 content/youtube/build-video.py --all                 # everything, every locale
python3 content/youtube/build-video.py --locale ar --audio   # just Arabic narration
python3 content/youtube/build-video.py --subtitles --docs    # text deliverables only
```

Stages, in dependency order: `--audio` → `--subtitles` → `--docs` → `--slides` → `--videos`
→ `--master`. Each is idempotent; re-running regenerates from `scenes.json`.

## Outputs

```text
build/
  audio/<locale>/NN-scene.wav        48 kHz stereo narration
  slides/<locale>/NN-scene.png       1920×1080 slides
  segments/<locale>/NN-scene.mp4     per-scene clips (identical encoder settings)
  video/<locale>.mp4                 concatenated, lossless join
  video/<locale>-subtitled.mp4       + soft mov_text subtitles
  video/master-multiaudio.mkv        1 video + 6 audio + 6 subtitle tracks, tagged
```

## Design decisions

- **Slides render in Chromium, not ffmpeg `drawtext`.** Chromium shapes Devanagari,
  Malayalam, Tamil, and Kannada correctly and handles Arabic bidi natively; `drawtext`
  renders glyph-by-glyph and breaks conjuncts and letter joining. The step indicator is
  wrapped in an LTR isolate — without it, "3 / 8" renders as "8 / 3" inside an RTL document.
- **Segments share identical encoder settings** (`libx264`, 30 fps, fixed GOP, AAC 48 kHz
  stereo) so the concat demuxer joins them with `-c copy` — no re-encode, no generation loss.
- **Explicit segment duration (`-t`), not `-shortest`.** With a looped image input,
  `-shortest` produced segments ~1.8 s longer than the narration; an explicit
  `lead + narration + tail` duration is deterministic.
- **Subtitles are timed from the measured narration** (not estimates) whenever audio exists,
  so the SRT matches the rendered video exactly. Voiceless locales fall back to a
  words-per-second estimate.
- **The master's audio tracks are extracted from the per-locale videos**, guaranteeing
  sync with the shared video timeline.

## Uploading to YouTube

1. **Per-locale uploads (simplest):** upload `build/video/<locale>-subtitled.mp4` as separate
   videos (or unlisted variants), using `metadata.md` for each locale's title and description.
   Set the subtitle language from the matching `subtitles/<locale>.srt` if the embedded track
   is not picked up automatically.
2. **Single video with multi-language audio (Studio feature):** YouTube's multi-language
   audio is configured in Studio after upload (Subtitles → Add audio track). Upload
   `build/video/en.mp4` first, then add each language's audio track and subtitle file from
   `subtitles/`. Availability of multi-language audio depends on channel eligibility.
3. **Local distribution:** `master-multiaudio.mkv` plays in VLC (Audio → Audio Track,
   Subtitles → Subtitle Track) and is the artifact to archive.

## Content review before publishing

- **Native-speaker review is strongly recommended** for the `hi`, `ml`, `ta`, `kn`, and `ar`
  narrations and subtitles — they were machine-drafted in `scenes.json` and should be read
  aloud once by a speaker of each language.
- Verify the spoken narration against the slide titles: they were written to be consistent,
  but a translator editing one side should update the other.
- The repo URL appears on every slide and in every description — find-and-replace it in
  `scenes.json`, `metadata.md`, and `content/README.md` if the repository moves.
