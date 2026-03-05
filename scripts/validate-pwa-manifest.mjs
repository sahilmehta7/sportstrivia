import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

function parseSizes(sizes) {
  if (!sizes || sizes === "any") return null;
  const match = sizes.trim().match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

function mimeForFormat(format) {
  if (!format) return null;
  const normalized = format.toLowerCase();
  if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
  if (normalized === "png") return "image/png";
  if (normalized === "webp") return "image/webp";
  if (normalized === "avif") return "image/avif";
  if (normalized === "svg") return "image/svg+xml";
  return null;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateImages(rootDir, images, kind, errors) {
  for (const img of images) {
    if (!img.src?.startsWith("/")) {
      errors.push(`${kind} src must be absolute-from-root, got "${img.src}"`);
      continue;
    }

    const filePath = path.join(rootDir, "public", img.src.slice(1));
    if (!(await exists(filePath))) {
      errors.push(`${kind} file missing: ${img.src}`);
      continue;
    }

    const metadata = await sharp(filePath).metadata();
    const actualType = mimeForFormat(metadata.format);
    if (img.type && actualType && img.type !== actualType) {
      errors.push(`${kind} type mismatch for ${img.src}: declared ${img.type}, actual ${actualType}`);
    }

    const declaredSizes = parseSizes(img.sizes);
    if (declaredSizes && (metadata.width !== declaredSizes.width || metadata.height !== declaredSizes.height)) {
      errors.push(
        `${kind} size mismatch for ${img.src}: declared ${declaredSizes.width}x${declaredSizes.height}, actual ${metadata.width}x${metadata.height}`
      );
    }
  }
}

async function main() {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, ".next", "server", "app", "manifest.webmanifest.body");
  if (!(await exists(manifestPath))) {
    console.error("Compiled manifest not found. Run `npm run build` first.");
    process.exit(1);
  }

  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);
  const errors = [];

  if (!manifest.id) {
    errors.push("manifest.id is required");
  }

  const icons = manifest.icons ?? [];
  const screenshots = manifest.screenshots ?? [];

  const has192 = icons.some((icon) => icon.type === "image/png" && icon.sizes === "192x192");
  const has512 = icons.some((icon) => icon.type === "image/png" && icon.sizes === "512x512");
  if (!has192) errors.push('manifest.icons must include a PNG icon with sizes "192x192"');
  if (!has512) errors.push('manifest.icons must include a PNG icon with sizes "512x512"');

  await validateImages(rootDir, icons, "icon", errors);
  await validateImages(rootDir, screenshots, "screenshot", errors);

  const swPath = path.join(rootDir, "public", "sw.js");
  if (!(await exists(swPath))) {
    errors.push("public/sw.js is missing");
  }

  if (errors.length > 0) {
    console.error("PWA manifest validation failed:");
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log("PWA manifest validation passed.");
}

await main();
