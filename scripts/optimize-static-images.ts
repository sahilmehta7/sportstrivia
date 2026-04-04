import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface ImageTask {
  input: string;
  output: string;
  width?: number;
  height?: number;
  quality: number;
  format: 'webp' | 'avif' | 'png' | 'jpeg';
}

const tasks: ImageTask[] = [
  // Badges → Small icons, aggressive optimization
  { input: 'public/badges/basketball-star.png', output: 'public/badges/basketball-star.webp', width: 128, height: 128, quality: 80, format: 'webp' },
  { input: 'public/badges/challenger.png', output: 'public/badges/challenger.webp', width: 128, height: 128, quality: 80, format: 'webp' },
  
  // Screenshots → WebP, reasonable quality
  { input: 'public/screenshot-mobile.png', output: 'public/screenshot-mobile.webp', width: 750, quality: 75, format: 'webp' },
  { input: 'public/screenshot-desktop.png', output: 'public/screenshot-desktop.webp', width: 1280, quality: 75, format: 'webp' },
  
  // grain.png → Tiny texture, can be heavily compressed
  { input: 'public/video/grain.png', output: 'public/video/grain.webp', width: 256, quality: 60, format: 'webp' },
];

async function optimizeImage(task: ImageTask): Promise<void> {
  const inputPath = path.resolve(task.input);
  const outputPath = path.resolve(task.output);
  
  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skipping ${task.input} - file not found`);
    return;
  }
  
  const originalSize = fs.statSync(inputPath).size;
  
  let pipeline = sharp(inputPath);
  
  if (task.width || task.height) {
    pipeline = pipeline.resize(task.width, task.height, { 
      fit: 'inside', 
      withoutEnlargement: true 
    });
  }
  
  switch (task.format) {
    case 'webp':
      pipeline = pipeline.webp({ quality: task.quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: task.quality });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: task.quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: task.quality });
      break;
  }
  
  await pipeline.toFile(outputPath);
  
  const newSize = fs.statSync(outputPath).size;
  const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
  
  console.log(`✅ ${path.basename(task.input)} → ${path.basename(task.output)}`);
  console.log(`   ${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (${reduction}% reduction)`);
}

async function main() {
  console.log('🚀 Optimizing static images...\n');
  
  for (const task of tasks) {
    await optimizeImage(task);
  }
  
  console.log('\n✨ Done! Update references in code to use new .webp files.');
}

main().catch(console.error);
