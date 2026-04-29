const sharp = require('sharp');
const logger = require('./logger');

/**
 * Optimize image buffer
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
async function optimizeImage(buffer, options = {}) {
    const {
        width = 800,
        height = 800,
        quality = 80,
        format = 'jpeg',
        fit = 'cover'
    } = options;

    try {
        let pipeline = sharp(buffer)
            .resize(width, height, {
                fit: fit,
                withoutEnlargement: true
            });

        // Apply format-specific optimizations
        switch (format.toLowerCase()) {
            case 'jpeg':
            case 'jpg':
                pipeline = pipeline.jpeg({
                    quality: quality,
                    progressive: true,
                    mozjpeg: true
                });
                break;
            case 'png':
                pipeline = pipeline.png({
                    quality: quality,
                    compressionLevel: 9,
                    progressive: true
                });
                break;
            case 'webp':
                pipeline = pipeline.webp({
                    quality: quality,
                    effort: 6
                });
                break;
            default:
                pipeline = pipeline.jpeg({
                    quality: quality,
                    progressive: true
                });
        }

        const optimizedBuffer = await pipeline.toBuffer();
        
        const originalSize = buffer.length;
        const optimizedSize = optimizedBuffer.length;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
        
        logger.info('Image optimized', {
            originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
            optimizedSize: `${(optimizedSize / 1024).toFixed(2)} KB`,
            savings: `${savings}%`
        });

        return optimizedBuffer;
    } catch (error) {
        logger.error('Image optimization failed', { error: error.message });
        throw error;
    }
}

/**
 * Generate multiple image sizes (thumbnail, medium, large)
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<Object>} - Object with different sizes
 */
async function generateImageSizes(buffer) {
    try {
        const [thumbnail, medium, large] = await Promise.all([
            sharp(buffer)
                .resize(150, 150, { fit: 'cover' })
                .jpeg({ quality: 80, progressive: true })
                .toBuffer(),
            sharp(buffer)
                .resize(400, 400, { fit: 'cover' })
                .jpeg({ quality: 85, progressive: true })
                .toBuffer(),
            sharp(buffer)
                .resize(800, 800, { fit: 'cover', withoutEnlargement: true })
                .jpeg({ quality: 90, progressive: true })
                .toBuffer()
        ]);

        return {
            thumbnail,
            medium,
            large
        };
    } catch (error) {
        logger.error('Failed to generate image sizes', { error: error.message });
        throw error;
    }
}

/**
 * Get image metadata
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} - Image metadata
 */
async function getImageMetadata(buffer) {
    try {
        const metadata = await sharp(buffer).metadata();
        return {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            size: buffer.length,
            hasAlpha: metadata.hasAlpha,
            orientation: metadata.orientation
        };
    } catch (error) {
        logger.error('Failed to get image metadata', { error: error.message });
        throw error;
    }
}

/**
 * Validate image
 * @param {Buffer} buffer - Image buffer
 * @param {Object} constraints - Validation constraints
 * @returns {Promise<Object>} - Validation result
 */
async function validateImage(buffer, constraints = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        minWidth = 100,
        minHeight = 100,
        maxWidth = 4000,
        maxHeight = 4000,
        allowedFormats = ['jpeg', 'jpg', 'png', 'webp']
    } = constraints;

    try {
        const metadata = await getImageMetadata(buffer);
        const errors = [];

        // Check file size
        if (metadata.size > maxSize) {
            errors.push(`Image size (${(metadata.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
        }

        // Check format
        if (!allowedFormats.includes(metadata.format.toLowerCase())) {
            errors.push(`Image format '${metadata.format}' is not allowed. Allowed formats: ${allowedFormats.join(', ')}`);
        }

        // Check dimensions
        if (metadata.width < minWidth || metadata.height < minHeight) {
            errors.push(`Image dimensions (${metadata.width}x${metadata.height}) are too small. Minimum: ${minWidth}x${minHeight}`);
        }

        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            errors.push(`Image dimensions (${metadata.width}x${metadata.height}) are too large. Maximum: ${maxWidth}x${maxHeight}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            metadata
        };
    } catch (error) {
        logger.error('Image validation failed', { error: error.message });
        return {
            valid: false,
            errors: ['Invalid image file'],
            metadata: null
        };
    }
}

module.exports = {
    optimizeImage,
    generateImageSizes,
    getImageMetadata,
    validateImage
};

// Made with Bob
