import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ICON = path.join(ROOT, 'assets/play-store/icon/app-icon-512x512.png');
const FEATURE_PNG = path.join(ROOT, 'assets/play-store/feature-graphic/feature-graphic-1024x500.png');
const FEATURE_JPG = path.join(ROOT, 'assets/play-store/feature-graphic/feature-graphic-1024x500.jpg');
const PHONE_DIR = path.join(ROOT, 'assets/play-store/screenshots/phone');
const METADATA = path.join(ROOT, 'docs/release/play-store/metadata.en-US.md');

const requiredShots = [
  '01-discover-quizzes.png',
  '02-gameplay-question.png',
  '03-results-summary.png',
  '04-social-challenges.png',
  '05-leaderboard.png',
  '06-profile-progress.png',
  '07-notifications.png',
  '08-privacy-controls.png',
];

function isNear(value, expected, tolerance = 0.02) {
  return Math.abs(value - expected) <= tolerance;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getMeta(filePath) {
  return sharp(filePath).metadata();
}

function parseQuotedItems(section) {
  const matches = section.match(/`([^`]+)`/g) ?? [];
  return matches.map((m) => m.slice(1, -1));
}

function splitSection(content, startTitle, endTitle) {
  const start = content.indexOf(startTitle);
  if (start < 0) return '';
  const end = endTitle ? content.indexOf(endTitle, start) : content.length;
  return content.slice(start, end < 0 ? content.length : end);
}

async function validateMetadata(errors) {
  const md = await fs.readFile(METADATA, 'utf8');

  const titleSection = splitSection(md, '## App Title Variants', '## Short Description Variants');
  const shortSection = splitSection(md, '## Short Description Variants', '## Full Description (Primary)');

  const titles = parseQuotedItems(titleSection);
  const shorts = parseQuotedItems(shortSection);

  if (titles.length < 3) {
    errors.push('metadata: expected at least 3 title variants in backticks');
  }
  if (shorts.length < 3) {
    errors.push('metadata: expected at least 3 short description variants in backticks');
  }

  for (const title of titles) {
    if (title.length > 30) {
      errors.push(`metadata: title exceeds 30 chars (${title.length}) -> "${title}"`);
    }
  }

  for (const shortText of shorts) {
    if (shortText.length > 80) {
      errors.push(`metadata: short description exceeds 80 chars (${shortText.length}) -> "${shortText}"`);
    }
  }

  if (md.length < 400) {
    errors.push('metadata: file appears too short; full description may be missing');
  }
}

async function validateIcon(errors) {
  if (!(await exists(ICON))) {
    errors.push('missing icon: assets/play-store/icon/app-icon-512x512.png');
    return;
  }

  const stat = await fs.stat(ICON);
  if (stat.size > 1024 * 1024) {
    errors.push(`icon file too large: ${(stat.size / 1024).toFixed(1)}KB (>1024KB)`);
  }

  const meta = await getMeta(ICON);
  if (meta.width !== 512 || meta.height !== 512) {
    errors.push(`icon dimensions invalid: ${meta.width}x${meta.height} (expected 512x512)`);
  }
  if (meta.format !== 'png') {
    errors.push(`icon format invalid: ${meta.format} (expected png)`);
  }
}

async function validateFeatureGraphic(errors) {
  const featureFile = (await exists(FEATURE_PNG)) ? FEATURE_PNG : FEATURE_JPG;
  if (!(await exists(featureFile))) {
    errors.push('missing feature graphic: expected 1024x500 png or jpg');
    return;
  }

  const meta = await getMeta(featureFile);
  if (meta.width !== 1024 || meta.height !== 500) {
    errors.push(`feature graphic dimensions invalid: ${meta.width}x${meta.height} (expected 1024x500)`);
  }

  if (!['png', 'jpeg'].includes(meta.format ?? '')) {
    errors.push(`feature graphic format invalid: ${meta.format} (expected png or jpeg)`);
  }
}

async function validatePhoneScreens(errors) {
  const entries = await fs.readdir(PHONE_DIR).catch(() => []);
  const files = entries.filter((f) => /\.png$|\.jpg$|\.jpeg$/i.test(f));

  if (files.length < 2) {
    errors.push(`phone screenshots: found ${files.length}, expected at least 2`);
    return;
  }

  for (const expected of requiredShots) {
    if (!files.includes(expected)) {
      errors.push(`phone screenshots: missing expected file ${expected}`);
    }
  }

  for (const file of files) {
    const fullPath = path.join(PHONE_DIR, file);
    const meta = await getMeta(fullPath);
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;

    if (w < 320 || h < 320 || w > 3840 || h > 3840) {
      errors.push(`${file}: dimensions out of Play bounds (${w}x${h})`);
    }

    if (Math.max(w, h) < 1080) {
      errors.push(`${file}: at least one side must be >=1080 (got ${w}x${h})`);
    }

    const ratio = w / h;
    const isPortraitNineSixteen = isNear(ratio, 9 / 16, 0.03);
    const isLandscapeSixteenNine = isNear(ratio, 16 / 9, 0.03);
    if (!isPortraitNineSixteen && !isLandscapeSixteenNine) {
      errors.push(`${file}: aspect ratio should be close to 9:16 or 16:9 (got ${w}:${h})`);
    }

    if (!['png', 'jpeg'].includes(meta.format ?? '')) {
      errors.push(`${file}: invalid format ${meta.format}; expected png or jpeg`);
    }
  }
}

async function run() {
  const errors = [];

  await validateMetadata(errors);
  await validateIcon(errors);
  await validateFeatureGraphic(errors);
  await validatePhoneScreens(errors);

  if (errors.length > 0) {
    console.error('Play Store asset validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Play Store assets validation passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
