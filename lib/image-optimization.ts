import sharp from 'sharp';

export interface ImageOptimizationOptions {
    width?: number;
    height?: number;
    quality?: number;
    maxSizeBytes?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Optimizes an image buffer by resizing, converting to WebP, and compressing.
 * Attempts to keep file size under maxSizeBytes.
 */
export async function optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = {}
): Promise<Buffer> {
    const {
        width = 1280,
        height = 720,
        quality: initialQuality = 80,
        maxSizeBytes = 500 * 1024, // 500KB default
        fit = 'inside',
    } = options;

    let quality = initialQuality;

    // First pass
    let optimizedBuffer = await sharp(buffer)
        .resize(width, height, { fit, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

    // Iteratively reduce quality if file is too large
    // We stop at quality 20 to avoid complete degradation
    while (optimizedBuffer.length > maxSizeBytes && quality > 20) {
        quality -= 15; // Aggressive step down
        optimizedBuffer = await sharp(buffer)
            .resize(width, height, { fit, withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();
    }

    return optimizedBuffer;
}
