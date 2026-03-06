import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, 'docs/release/play-store/screenshot-manifest.v1.json');
const REPORT_PATH = path.join(ROOT, 'docs/release/play-store/screenshot-capture-report.json');
const SCREENSHOT_DIR = path.join(ROOT, 'assets/play-store/screenshots/phone');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  const errors = [];

  if (!(await exists(MANIFEST_PATH))) {
    throw new Error(`Missing manifest: ${MANIFEST_PATH}`);
  }

  if (!(await exists(REPORT_PATH))) {
    throw new Error(`Missing capture report: ${REPORT_PATH}`);
  }

  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const report = JSON.parse(await fs.readFile(REPORT_PATH, 'utf8'));
  const shotsByName = new Map((report.shots ?? []).map((s) => [s.name, s]));

  for (const shot of manifest.shots) {
    const filePath = path.join(SCREENSHOT_DIR, shot.name);
    if (!(await exists(filePath))) {
      errors.push(`${shot.name}: missing final composited screenshot`);
      continue;
    }

    const meta = await sharp(filePath).metadata();
    if (meta.width !== 1080 || meta.height !== 1920) {
      errors.push(`${shot.name}: expected 1080x1920, got ${meta.width}x${meta.height}`);
    }

    const capture = shotsByName.get(shot.name);
    if (!capture) {
      errors.push(`${shot.name}: missing entry in screenshot-capture-report.json`);
      continue;
    }

    if (!capture.success) {
      errors.push(`${shot.name}: capture reported as failed`);
    }

    if (!capture.focusFound) {
      errors.push(`${shot.name}: focus selector not found (${capture.focusSelector ?? 'none'})`);
    }

    if (capture.issues?.includes('focus_outside_safe_area')) {
      errors.push(`${shot.name}: focus outside safe area`);
    }

    const hardIssues = (capture.issues ?? []).filter((issue) => String(issue).startsWith('capture_error:'));
    if (hardIssues.length > 0) {
      errors.push(`${shot.name}: ${hardIssues.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    console.error('Screenshot QA failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Screenshot content QA passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
