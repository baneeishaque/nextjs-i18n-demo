/**
 * Renders one 1920x1080 slide PNG per scene per locale.
 *
 * Slides are rendered by headless Chromium rather than ffmpeg's drawtext
 * because Chromium shapes complex scripts correctly (Devanagari,
 * Malayalam, Tamil, Kannada) and handles Arabic bidi natively — drawtext
 * renders glyph-by-glyph and breaks conjuncts and letter joining.
 *
 * Usage:
 *   node content/youtube/render-slides.mjs                 # every locale
 *   node content/youtube/render-slides.mjs --locale ar     # one locale
 *   node content/youtube/render-slides.mjs --out <dir>     # custom output
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = join(HERE, "build", "slides");

/**
 * Parses `--flag value` pairs from the CLI arguments.
 *
 * @param {string[]} argv - Raw `process.argv` slice.
 * @returns {Record<string, string>} Flag map.
 */
function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith("--")) {
      args[argv[index].slice(2)] = argv[index + 1];
      index += 1;
    }
  }
  return args;
}

/**
 * Escapes text for safe interpolation into slide HTML.
 *
 * @param {string} text - Raw text.
 * @returns {string} HTML-escaped text.
 */
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Builds the full slide document for one scene.
 *
 * Fonts resolve through the system stack: macOS ships script-specific
 * families (Devanagari Sangam MN, Malayalam Sangam MN, Tamil Sangam MN,
 * Kannada Sangam MN, Geeza Pro) that Chromium picks by glyph coverage.
 *
 * @param {object} options - Slide inputs.
 * @param {object} options.scene - Scene record from `scenes.json`.
 * @param {string} options.locale - Locale code for this slide.
 * @param {number} options.index - Zero-based scene index.
 * @param {number} options.total - Total scene count.
 * @param {object} options.meta - `scenes.json` meta block.
 * @returns {string} Complete HTML document.
 */
function buildSlideHtml({ scene, locale, index, total, meta }) {
  const direction = locale === "ar" ? "rtl" : "ltr";
  const title = escapeHtml(scene.title[locale]);
  const code = escapeHtml(scene.code);
  const step = `${index + 1} / ${total}`;

  return `<!doctype html>
<html lang="${locale}" dir="${direction}">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #111827 100%);
    color: #f8fafc;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 160px;
    position: relative;
  }
  .step {
    position: absolute;
    top: 56px;
    inset-inline-end: 96px;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: #64748b;
    /* Latin numerals inside an RTL document reorder without this isolate:
       "3 / 8" would render as "8 / 3". */
    direction: ltr;
    unicode-bidi: isolate;
  }
  .brand {
    position: absolute;
    top: 56px;
    inset-inline-start: 96px;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #818cf8;
  }
  h1 {
    font-size: 104px;
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: -0.015em;
    max-width: 1500px;
  }
  .accent {
    width: 180px;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(90deg, #6366f1, #22d3ee);
    margin: 48px 0;
  }
  code {
    display: inline-block;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 40px;
    direction: ltr;
    color: #a5b4fc;
    background: rgba(99, 102, 241, 0.14);
    border: 2px solid rgba(99, 102, 241, 0.35);
    border-radius: 16px;
    padding: 24px 36px;
    max-width: 1600px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .repo {
    position: absolute;
    bottom: 56px;
    inset-inline-start: 96px;
    font-size: 26px;
    color: #475569;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    direction: ltr;
  }
</style>
</head>
<body>
  <span class="brand">Polyglot Starter</span>
  <span class="step">${step}</span>
  <h1>${title}</h1>
  <div class="accent"></div>
  <code>${code}</code>
  <span class="repo">${escapeHtml(meta.repoUrl)}</span>
</body>
</html>`;
}

const args = parseArgs(process.argv.slice(2));
const scenesPath = join(HERE, "scenes.json");
const data = JSON.parse(await readFile(scenesPath, "utf8"));
const outRoot = resolve(args.out ?? DEFAULT_OUT);

const locales = args.locale ? [args.locale] : Object.keys(data.voices);
const { width, height } = data.meta.resolution;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });

for (const locale of locales) {
  const localeDir = join(outRoot, locale);
  await mkdir(localeDir, { recursive: true });

  for (const [index, scene] of data.scenes.entries()) {
    const html = buildSlideHtml({
      scene,
      locale,
      index,
      total: data.scenes.length,
      meta: data.meta,
    });
    await page.setContent(html, { waitUntil: "load" });
    const file = join(localeDir, `${String(index).padStart(2, "0")}-${scene.id}.png`);
    await page.screenshot({ path: file });
    console.log(`rendered ${file}`);
  }
}

await browser.close();
console.log(`\nSlides written to ${outRoot}`);
