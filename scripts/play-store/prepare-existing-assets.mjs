import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PHONE_DIR = path.join(ROOT, 'assets/play-store/screenshots/phone');
const ICON_DIR = path.join(ROOT, 'assets/play-store/icon');
const TABLET_DIR = path.join(ROOT, 'assets/play-store/screenshots/tablet');

const mobileSource = path.join(ROOT, 'public/screenshot-mobile.png');
const desktopSource = path.join(ROOT, 'public/screenshot-desktop.png');
const iconSource = path.join(ROOT, 'public/pwa-512x512.png');

const portraitShots = [
  '01-discover-quizzes.png',
  '02-gameplay-question.png',
  '03-results-summary.png',
  '04-social-challenges.png',
  '06-profile-progress.png',
  '07-notifications.png',
  '08-privacy-controls.png',
];

const landscapeShots = ['05-leaderboard.png'];

const overlays = {
  '01-discover-quizzes.png': 'Discover quizzes',
  '02-gameplay-question.png': 'Fast quiz gameplay',
  '03-results-summary.png': 'Instant score feedback',
  '04-social-challenges.png': 'Challenge your friends',
  '05-leaderboard.png': 'Climb leaderboards',
  '06-profile-progress.png': 'Track your progress',
  '07-notifications.png': 'Stay in the action',
  '08-privacy-controls.png': 'In-app account controls',
};

function textOverlay(width, height, label) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"/>
      <rect x="40" y="56" rx="22" ry="22" width="460" height="66" fill="#0f172a" fill-opacity="0.58"/>
      <text x="68" y="100" fill="#ffffff" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700">${label}</text>
    </svg>
  `);
}

async function ensureDirs() {
  await fs.mkdir(PHONE_DIR, { recursive: true });
  await fs.mkdir(ICON_DIR, { recursive: true });
  await fs.mkdir(TABLET_DIR, { recursive: true });
}

async function writeIcon() {
  const out = path.join(ICON_DIR, 'app-icon-512x512.png');
  await sharp(iconSource).resize(512, 512).png().toFile(out);
}

async function writePortraits() {
  for (const file of portraitShots) {
    const out = path.join(PHONE_DIR, file);
    await sharp(mobileSource)
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .composite([{ input: textOverlay(1080, 1920, overlays[file]) }])
      .png({ compressionLevel: 9 })
      .toFile(out);
  }
}

async function writeLandscapes() {
  for (const file of landscapeShots) {
    const out = path.join(PHONE_DIR, file);
    await sharp(desktopSource)
      .resize(1920, 1080, { fit: 'cover', position: 'center' })
      .composite([{ input: textOverlay(1920, 1080, overlays[file]) }])
      .png({ compressionLevel: 9 })
      .toFile(out);
  }
}

async function writeTabletOptional() {
  const out = path.join(TABLET_DIR, '01-tablet-overview.png');
  await sharp(desktopSource)
    .resize(1920, 1200, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9 })
    .toFile(out);
}

async function run() {
  await ensureDirs();
  await writeIcon();
  await writePortraits();
  await writeLandscapes();
  await writeTabletOptional();
  console.log('Prepared baseline Play Store assets from existing visuals.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
