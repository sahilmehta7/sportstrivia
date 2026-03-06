import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, 'public/logo.png');
const OUT_DIR = path.join(ROOT, 'assets/play-store/feature-graphic');
const OUT_PNG = path.join(OUT_DIR, 'feature-graphic-1024x500.png');
const OUT_JPG = path.join(OUT_DIR, 'feature-graphic-1024x500.jpg');

const WIDTH = 1024;
const HEIGHT = 500;

const gradientSvg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="55%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>

  <circle cx="70" cy="60" r="160" fill="#ffffff" opacity="0.08"/>
  <circle cx="980" cy="450" r="200" fill="#ffffff" opacity="0.08"/>

  <text x="370" y="210" fill="#ffffff" font-size="54" font-family="Arial, Helvetica, sans-serif" font-weight="700" filter="url(#shadow)">
    Sports Trivia
  </text>
  <text x="370" y="270" fill="#e2e8f0" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="500">
    Compete. Challenge. Climb.
  </text>
  <text x="370" y="320" fill="#dbeafe" font-size="24" font-family="Arial, Helvetica, sans-serif" font-weight="400">
    Fast sports quizzes with social play
  </text>
</svg>
`;

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function run() {
  await ensureDir(OUT_DIR);

  const logo = await sharp(LOGO_PATH)
    .resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const base = sharp(Buffer.from(gradientSvg));

  const composed = base.composite([
    {
      input: logo,
      left: 90,
      top: 130,
    },
  ]);

  await composed
    .clone()
    .flatten({ background: '#0f172a' })
    .png({ compressionLevel: 9 })
    .toFile(OUT_PNG);

  await composed
    .clone()
    .flatten({ background: '#0f172a' })
    .jpeg({ quality: 92 })
    .toFile(OUT_JPG);

  console.log(`Feature graphics generated:\n- ${OUT_PNG}\n- ${OUT_JPG}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
