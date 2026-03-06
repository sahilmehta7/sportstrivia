import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, 'assets/play-store/screenshots/phone/raw');
const OUTPUT_DIR = path.join(ROOT, 'assets/play-store/screenshots/phone');
const OVERLAY_SPEC_PATH = path.join(ROOT, 'docs/release/play-store/screenshot-overlays.en-US.json');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildOverlaySvg({ width, height, spec, shotName }) {
  const entry = spec.overlays[shotName];
  if (!entry || !entry.headline) return null;

  const theme = spec.theme;
  const defaults = spec.defaults;

  const paddingX = defaults.paddingX;
  const maxWidth = defaults.maxWidth;
  const headlineY = defaults.headlineY;
  const subtextY = defaults.subtextY;

  const headline = escapeXml(entry.headline);
  const subtext = entry.subtext ? escapeXml(entry.subtext) : '';

  const blockHeight = subtext ? 128 : 92;

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${theme.shadow}" flood-opacity="1" />
      </filter>
      <linearGradient id="accentLine" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="${theme.accent}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.4"/>
      </linearGradient>
    </defs>

    <rect x="${paddingX}" y="32" rx="24" ry="24" width="${maxWidth}" height="${blockHeight}" fill="${theme.pillBg}" stroke="${theme.pillBorder}" />
    <rect x="${paddingX + 20}" y="56" width="220" height="4" fill="url(#accentLine)" rx="2" ry="2" />

    <text x="${paddingX + 22}" y="${headlineY}" fill="${theme.headlineColor}" font-size="44" font-weight="800" letter-spacing="0.5" font-family="${theme.fontFamily}" filter="url(#shadow)">
      ${headline}
    </text>

    ${subtext ? `<text x="${paddingX + 22}" y="${subtextY}" fill="${theme.subtextColor}" font-size="28" font-weight="600" letter-spacing="0.3" font-family="${theme.fontFamily}" filter="url(#shadow)">${subtext}</text>` : ''}
  </svg>`;
}

async function run() {
  const spec = JSON.parse(await fs.readFile(OVERLAY_SPEC_PATH, 'utf8'));
  const files = (await fs.readdir(RAW_DIR)).filter((f) => /\.(png|jpe?g)$/i.test(f));

  for (const file of files) {
    const src = path.join(RAW_DIR, file);
    const out = path.join(OUTPUT_DIR, file);

    const image = sharp(src);
    const meta = await image.metadata();
    const width = meta.width ?? 1080;
    const height = meta.height ?? 1920;

    const svg = buildOverlaySvg({ width, height, spec, shotName: file });
    if (!svg) {
      await fs.copyFile(src, out);
      continue;
    }

    await image
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png({ compressionLevel: 9 })
      .toFile(out);

    console.log(`Overlay applied: ${file}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
