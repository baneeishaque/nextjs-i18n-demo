#!/usr/bin/env python3
"""Build the multilingual YouTube video kit from ``scenes.json``.

The pipeline has six deterministic stages, each runnable on its own:

1. ``--audio``      macOS ``say`` narration per locale and scene (AIFF -> WAV).
2. ``--subtitles``  SRT + VTT per locale, timed from the measured narration.
3. ``--docs``       Human-readable ``script.md`` and ``storyboard.md``.
4. ``--slides``     Delegates to ``render-slides.mjs`` (headless Chromium).
5. ``--videos``     Per-locale MP4: slide + narration, then subtitles muxed in.
6. ``--master``     Multi-audio MKV: one video track, every locale's audio and
                    subtitle track, each tagged with its language.

``--all`` runs everything for every locale that has a voice. Locales without
a system voice (currently Malayalam) still receive subtitles and a silent
video, so nothing silently disappears from the kit.

Outputs land under ``build/`` (git-ignored); the committed deliverables are
the generated ``subtitles/*.srt`` and ``subtitles/*.vtt`` files.

Requirements: Python 3.9+ (stdlib only), ``ffmpeg``/``ffprobe`` on PATH,
Node.js with the repository's dev dependencies installed, and macOS for the
``say`` stage. Run from anywhere; paths are resolved relative to this file.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent.parent
SCENES_FILE = HERE / "scenes.json"
BUILD_DIR = HERE / "build"
AUDIO_DIR = BUILD_DIR / "audio"
SLIDES_DIR = BUILD_DIR / "slides"
SEGMENTS_DIR = BUILD_DIR / "segments"
VIDEO_DIR = BUILD_DIR / "video"
SUBTITLES_DIR = HERE / "subtitles"

LANGUAGES = {
    "en": "eng",
    "hi": "hin",
    "ml": "mal",
    "ta": "tam",
    "kn": "kan",
    "ar": "ara",
}

WORDS_PER_SECOND = 2.4
MIN_ESTIMATED_SECONDS = 3.0


@dataclass(frozen=True)
class Scene:
    """One slide/narration unit of the video."""

    index: int
    scene_id: str
    code: str
    titles: dict[str, str]
    narrations: dict[str, str]


def run(command: list[str], *, quiet: bool = False) -> subprocess.CompletedProcess[str]:
    """Run a subprocess, raising on failure.

    Args:
        command: Full argv of the command to execute.
        quiet: Suppress ffmpeg's banner noise on stdout.

    Returns:
        The completed process (stdout captured as text).
    """
    return subprocess.run(
        command,
        check=True,
        stdout=subprocess.DEVNULL if quiet else subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def require_tool(name: str) -> None:
    """Fail fast with a clear message when an external tool is missing.

    Args:
        name: Executable name to look up on PATH.
    """
    if shutil.which(name) is None:
        sys.exit(f"error: required tool '{name}' is not on PATH")


def load_data() -> dict[str, Any]:
    """Load and validate ``scenes.json``.

    Returns:
        Parsed document with ``meta``, ``voices``, and ``scenes`` keys.
    """
    with SCENES_FILE.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not data.get("scenes"):
        sys.exit("error: scenes.json contains no scenes")
    return data


def scenes_of(data: dict[str, Any]) -> list[Scene]:
    """Convert the raw JSON scenes into typed records.

    Args:
        data: Parsed ``scenes.json`` document.

    Returns:
        Ordered scene records.
    """
    return [
        Scene(
            index=index,
            scene_id=raw["id"],
            code=raw["code"],
            titles=raw["title"],
            narrations=raw["narration"],
        )
        for index, raw in enumerate(data["scenes"])
    ]


def available_voices() -> set[str]:
    """Return the set of voice names installed on this machine.

    Returns:
        Voice names as reported by ``say -v ?``.
    """
    result = run(["say", "-v", "?"])
    voices: set[str] = set()
    for line in result.stdout.splitlines():
        name = line.split()[0] if line.split() else ""
        if name:
            voices.add(name)
    return voices


def resolve_locales(data: dict[str, Any], requested: str | None) -> list[str]:
    """Determine which locales to process.

    Args:
        data: Parsed ``scenes.json`` document.
        requested: Optional single locale from the CLI.

    Returns:
        Ordered list of locale codes to process.
    """
    all_locales = list(data["voices"].keys())
    if requested is None:
        return all_locales
    if requested not in all_locales:
        sys.exit(f"error: locale '{requested}' is not declared in scenes.json")
    return [requested]


def scene_audio_path(locale: str, scene: Scene) -> Path:
    """Canonical WAV path for one scene's narration.

    Args:
        locale: Locale code.
        scene: Scene record.

    Returns:
        Path under ``build/audio/<locale>/``.
    """
    return AUDIO_DIR / locale / f"{scene.index:02d}-{scene.scene_id}.wav"


def probe_duration(path: Path) -> float:
    """Read a media file's duration in seconds.

    Args:
        path: Media file to probe.

    Returns:
        Duration in seconds as a float.
    """
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            str(path),
        ]
    )
    return float(result.stdout.strip())


def estimate_duration(text: str) -> float:
    """Estimate narration length when no audio exists (voice-less locales).

    Args:
        text: Narration text.

    Returns:
        Estimated seconds, floored at ``MIN_ESTIMATED_SECONDS``.
    """
    return max(MIN_ESTIMATED_SECONDS, len(text.split()) / WORDS_PER_SECOND)


def generate_audio(data: dict[str, Any], locales: list[str]) -> None:
    """Synthesize narration for every scene of every locale.

    Locales whose configured voice is missing are skipped with a warning so
    the rest of the pipeline still produces their slides and subtitles.

    Args:
        data: Parsed ``scenes.json`` document.
        locales: Locales to process.
    """
    require_tool("say")
    require_tool("ffmpeg")
    installed = available_voices()
    voices: dict[str, str | None] = data["voices"]
    scenes = scenes_of(data)

    for locale in locales:
        voice = voices.get(locale)
        if voice is None:
            print(f"[audio] {locale}: no voice configured — skipping narration")
            continue
        if voice not in installed:
            print(f"[audio] {locale}: voice '{voice}' not installed — skipping narration")
            continue

        target_dir = AUDIO_DIR / locale
        target_dir.mkdir(parents=True, exist_ok=True)

        for scene in scenes:
            aiff = target_dir / f"{scene.index:02d}-{scene.scene_id}.aiff"
            wav = scene_audio_path(locale, scene)
            text = scene.narrations[locale]
            run(["say", "-v", voice, "-o", str(aiff), text], quiet=True)
            run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(aiff),
                    "-ar",
                    "48000",
                    "-ac",
                    "2",
                    "-c:a",
                    "pcm_s16le",
                    str(wav),
                ],
                quiet=True,
            )
            aiff.unlink()
            print(f"[audio] {locale}/{scene.scene_id}: {probe_duration(wav):.2f}s")


def scene_duration(data: dict[str, Any], locale: str, scene: Scene) -> float:
    """Duration of one scene's narration, measured or estimated.

    Args:
        data: Parsed ``scenes.json`` document.
        locale: Locale code.
        scene: Scene record.

    Returns:
        Seconds of narration for this scene.
    """
    wav = scene_audio_path(locale, scene)
    if wav.exists():
        return probe_duration(wav)
    return estimate_duration(scene.narrations[locale])


def srt_timestamp(seconds: float) -> str:
    """Format seconds as an SRT timestamp (``HH:MM:SS,mmm``).

    Args:
        seconds: Absolute time in seconds.

    Returns:
        SRT-formatted timestamp.
    """
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def vtt_timestamp(seconds: float) -> str:
    """Format seconds as a WebVTT timestamp (``HH:MM:SS.mmm``).

    Args:
        seconds: Absolute time in seconds.

    Returns:
        VTT-formatted timestamp.
    """
    return srt_timestamp(seconds).replace(",", ".")


def build_cues(data: dict[str, Any], locale: str) -> list[tuple[float, float, str]]:
    """Compute subtitle cues for one locale.

    Cue boundaries follow the video timeline: each scene occupies its
    narration duration plus the configured lead-in and tail padding, so the
    subtitles match the final video exactly.

    Args:
        data: Parsed ``scenes.json`` document.
        locale: Locale code.

    Returns:
        List of ``(start, end, text)`` cues in seconds.
    """
    lead = float(data["meta"]["leadInSeconds"])
    tail = float(data["meta"]["tailSeconds"])
    cues: list[tuple[float, float, str]] = []
    cursor = 0.0

    for scene in scenes_of(data):
        start = cursor + lead
        end = start + scene_duration(data, locale, scene)
        cues.append((start, end, scene.narrations[locale]))
        cursor = end + tail

    return cues


def write_subtitles(data: dict[str, Any], locales: list[str]) -> None:
    """Write SRT and VTT subtitle files for every locale.

    Args:
        data: Parsed ``scenes.json`` document.
        locales: Locales to process.
    """
    SUBTITLES_DIR.mkdir(parents=True, exist_ok=True)

    for locale in locales:
        cues = build_cues(data, locale)

        srt_lines: list[str] = []
        vtt_lines: list[str] = ["WEBVTT", ""]
        for number, (start, end, text) in enumerate(cues, start=1):
            srt_lines.append(str(number))
            srt_lines.append(f"{srt_timestamp(start)} --> {srt_timestamp(end)}")
            srt_lines.append(text)
            srt_lines.append("")
            vtt_lines.append(f"{vtt_timestamp(start)} --> {vtt_timestamp(end)}")
            vtt_lines.append(text)
            vtt_lines.append("")

        (SUBTITLES_DIR / f"{locale}.srt").write_text("\n".join(srt_lines), encoding="utf-8")
        (SUBTITLES_DIR / f"{locale}.vtt").write_text("\n".join(vtt_lines), encoding="utf-8")
        total = cues[-1][1] if cues else 0.0
        print(f"[subtitles] {locale}: {len(cues)} cues, {total:.1f}s timeline")


def write_docs(data: dict[str, Any]) -> None:
    """Write the human-readable ``script.md`` and ``storyboard.md``.

    Args:
        data: Parsed ``scenes.json`` document.
    """
    scenes = scenes_of(data)
    voices: dict[str, str | None] = data["voices"]
    locales = list(voices.keys())

    script_lines = [
        "# Narration script",
        "",
        "Generated from [`scenes.json`](scenes.json) by `build-video.py --docs`.",
        "Edit the JSON, not this file.",
        "",
        "## Voices",
        "",
        "| Locale | Voice |",
        "| ------ | ----- |",
    ]
    for locale in locales:
        script_lines.append(f"| `{locale}` | {voices[locale] or '— (record or cloud TTS)'} |")

    for scene in scenes:
        # Trailing punctuation is stripped from headings: MD026 forbids it,
        # and scene titles are written as sentences.
        heading = scene.titles["en"].rstrip(".")
        script_lines += ["", f"## {scene.index + 1}. {heading}", ""]
        script_lines += [f"On-screen code: `{scene.code}`", ""]
        for locale in locales:
            script_lines += [
                textwrap.fill(
                    scene.narrations[locale],
                    width=118,
                    initial_indent=f"**{locale}** — ",
                    subsequent_indent="  ",
                ),
                "",
            ]

    script_body = re.sub(r"\n{3,}", "\n\n", "\n".join(script_lines)).rstrip() + "\n"
    (HERE / "script.md").write_text(script_body, encoding="utf-8")

    lead = float(data["meta"]["leadInSeconds"])
    tail = float(data["meta"]["tailSeconds"])
    storyboard_lines = [
        "# Storyboard",
        "",
        "Generated from [`scenes.json`](scenes.json) by `build-video.py --docs`.",
        "Timings are the English narration timeline; other locales shift slightly.",
        "",
        "| # | Time | Slide title (en) | On-screen code | Narration (en) |",
        "| - | ---- | ---------------- | -------------- | -------------- |",
    ]
    cursor = 0.0
    for scene in scenes:
        start = cursor + lead
        end = start + scene_duration(data, "en", scene)
        title = scene.titles["en"].replace("|", "\\|")
        code = scene.code.replace("|", "\\|")
        narration = scene.narrations["en"].replace("|", "\\|")
        storyboard_lines.append(
            f"| {scene.index + 1} | {start:.1f}–{end:.1f}s | {title} | `{code}` | {narration} |"
        )
        cursor = end + tail

    (HERE / "storyboard.md").write_text(
        "\n".join(storyboard_lines).rstrip() + "\n", encoding="utf-8"
    )
    print(f"[docs] wrote script.md and storyboard.md ({len(scenes)} scenes)")


def render_slides(locales: list[str]) -> None:
    """Render slide PNGs via the Playwright-based helper.

    Args:
        locales: Locales to render.
    """
    require_tool("node")
    for locale in locales:
        run(
            ["node", str(HERE / "render-slides.mjs"), "--locale", locale, "--out", str(SLIDES_DIR)]
        )
    print(f"[slides] rendered {len(locales)} locale(s)")


def slide_path(locale: str, scene: Scene) -> Path:
    """Canonical slide PNG path for one scene.

    Args:
        locale: Locale code.
        scene: Scene record.

    Returns:
        Path under ``build/slides/<locale>/``.
    """
    return SLIDES_DIR / locale / f"{scene.index:02d}-{scene.scene_id}.png"


def build_segment(data: dict[str, Any], locale: str, scene: Scene) -> Path:
    """Render one scene as an MP4 segment (slide + narration).

    All segments share identical encoder settings so the concat demuxer can
    join them with ``-c copy``.

    Args:
        data: Parsed ``scenes.json`` document.
        locale: Locale code.
        scene: Scene record.

    Returns:
        Path to the segment file.
    """
    slide = slide_path(locale, scene)
    if not slide.exists():
        sys.exit(f"error: slide missing for {locale}/{scene.scene_id} — run --slides first")

    lead = float(data["meta"]["leadInSeconds"])
    tail = float(data["meta"]["tailSeconds"])
    wav = scene_audio_path(locale, scene)
    duration = scene_duration(data, locale, scene)
    # Explicit output duration instead of `-shortest`: with a looped image
    # input, `-shortest` produced segments ~1.8s longer than the narration.
    total = lead + duration + tail
    target_dir = SEGMENTS_DIR / locale
    target_dir.mkdir(parents=True, exist_ok=True)
    segment = target_dir / f"{scene.index:02d}-{scene.scene_id}.mp4"

    if wav.exists():
        audio_input = ["-i", str(wav)]
    else:
        audio_input = ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]
    audio_filter = f"[1:a]adelay={int(lead * 1000)}|{int(lead * 1000)},apad=pad_dur={tail}[a]"

    run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-framerate",
            str(data["meta"]["fps"]),
            "-i",
            str(slide),
            *audio_input,
            "-filter_complex",
            audio_filter,
            "-map",
            "0:v",
            "-map",
            "[a]",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-tune",
            "stillimage",
            "-pix_fmt",
            "yuv420p",
            "-g",
            "60",
            "-keyint_min",
            "60",
            "-sc_threshold",
            "0",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-t",
            f"{total:.3f}",
            "-movflags",
            "+faststart",
            str(segment),
        ],
        quiet=True,
    )
    return segment


def concat_segments(locale: str, segments: list[Path], output: Path) -> None:
    """Join segments losslessly with the concat demuxer.

    Args:
        locale: Locale code (used for the temp list file name).
        segments: Ordered segment files.
        output: Destination MP4 path.
    """
    list_file = SEGMENTS_DIR / locale / "concat.txt"
    list_file.write_text(
        "".join(f"file '{segment.resolve()}'\n" for segment in segments), encoding="utf-8"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(output),
        ],
        quiet=True,
    )


def build_videos(data: dict[str, Any], locales: list[str]) -> dict[str, Path]:
    """Assemble per-locale videos and mux their subtitles.

    Args:
        data: Parsed ``scenes.json`` document.
        locales: Locales to process.

    Returns:
        Map of locale to its subtitled MP4 path.
    """
    scenes = scenes_of(data)
    outputs: dict[str, Path] = {}

    for locale in locales:
        segments = [build_segment(data, locale, scene) for scene in scenes]
        plain = VIDEO_DIR / f"{locale}.mp4"
        concat_segments(locale, segments, plain)

        subtitled = VIDEO_DIR / f"{locale}-subtitled.mp4"
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(plain),
                "-i",
                str(SUBTITLES_DIR / f"{locale}.srt"),
                "-map",
                "0",
                "-map",
                "1",
                "-c",
                "copy",
                "-c:s",
                "mov_text",
                "-metadata:s:s:0",
                f"language={LANGUAGES[locale]}",
                "-movflags",
                "+faststart",
                str(subtitled),
            ],
            quiet=True,
        )
        outputs[locale] = subtitled
        print(f"[videos] {locale}: {plain.name} + subtitles ({probe_duration(plain):.1f}s)")

    return outputs


def build_master(data: dict[str, Any], locales: list[str]) -> None:
    """Mux the master MKV: English video + every locale's audio and subtitles.

    Args:
        data: Parsed ``scenes.json`` document.
        locales: Locales whose tracks should be included.
    """
    reference = VIDEO_DIR / "en.mp4"
    if not reference.exists():
        sys.exit("error: build/video/en.mp4 missing — run --videos first")

    command = ["ffmpeg", "-y", "-i", str(reference)]
    audio_locales = [locale for locale in locales if (VIDEO_DIR / f"{locale}.mp4").exists()]
    subtitle_locales = [locale for locale in locales if (SUBTITLES_DIR / f"{locale}.srt").exists()]

    for locale in audio_locales:
        command += ["-i", str(VIDEO_DIR / f"{locale}.mp4")]
    for locale in subtitle_locales:
        command += ["-i", str(SUBTITLES_DIR / f"{locale}.srt")]

    command += ["-map", "0:v"]
    for index, _ in enumerate(audio_locales, start=1):
        command += ["-map", f"{index}:a"]
    first_subtitle = 1 + len(audio_locales)
    for index, _ in enumerate(subtitle_locales):
        command += ["-map", f"{first_subtitle + index}:s"]

    command += ["-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-c:s", "srt"]
    for index, locale in enumerate(audio_locales):
        command += [
            f"-metadata:s:a:{index}",
            f"language={LANGUAGES[locale]}",
            f"-metadata:s:a:{index}",
            f"title={locale.upper()} narration",
        ]
    for index, locale in enumerate(subtitle_locales):
        command += [f"-metadata:s:s:{index}", f"language={LANGUAGES[locale]}"]

    master = VIDEO_DIR / "master-multiaudio.mkv"
    command.append(str(master))
    run(command, quiet=True)
    print(
        f"[master] {master.name}: video + {len(audio_locales)} audio + "
        f"{len(subtitle_locales)} subtitle tracks"
    )


def main() -> None:
    """Parse arguments and run the requested pipeline stages."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--audio", action="store_true", help="synthesize narration")
    parser.add_argument("--subtitles", action="store_true", help="write SRT/VTT files")
    parser.add_argument("--docs", action="store_true", help="write script.md and storyboard.md")
    parser.add_argument("--slides", action="store_true", help="render slide PNGs")
    parser.add_argument("--videos", action="store_true", help="assemble per-locale videos")
    parser.add_argument("--master", action="store_true", help="mux the multi-audio MKV")
    parser.add_argument("--all", action="store_true", help="run every stage")
    parser.add_argument("--locale", help="restrict to one locale (default: all)")
    args = parser.parse_args()

    if not any([args.audio, args.subtitles, args.docs, args.slides, args.videos, args.master, args.all]):
        parser.print_help()
        sys.exit(1)

    data = load_data()
    locales = resolve_locales(data, args.locale)

    if args.all or args.audio:
        generate_audio(data, locales)
    if args.all or args.subtitles:
        write_subtitles(data, locales)
    if args.all or args.docs:
        write_docs(data)
    if args.all or args.slides:
        render_slides(locales)
    if args.all or args.videos:
        build_videos(data, locales)
    if args.all or args.master:
        build_master(data, locales)


if __name__ == "__main__":
    main()
