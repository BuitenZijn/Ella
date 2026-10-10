/**
 * Image compression utilities for client-side optimization before upload.
 *
 * Uses browser-image-compression to reduce file sizes while maintaining quality.
 * Compression happens in a Web Worker to avoid blocking the UI.
 *
 * The library (~26 KB gzip) is imported when an image is first compressed,
 * not with this module: this module reaches every page that imports the
 * `components/common` or `lib` barrels, and most of them never upload.
 */

/**
 * Compression presets for different use cases
 */
export const COMPRESSION_PRESETS = {
  /** Profile pictures - small, fast loading */
  profilePicture: {
    maxSizeMB: 0.2, // 200KB max
    maxWidthOrHeight: 512, // Sufficient for retina displays
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.85,
  },
  /** Quest cover images - larger, higher quality */
  questCover: {
    maxSizeMB: 0.5, // 500KB max
    maxWidthOrHeight: 1200, // Hero image size
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.8,
  },
  /** POI photos - medium size */
  poiPhoto: {
    maxSizeMB: 0.3, // 300KB max
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.82,
  },
} as const

export type CompressionPreset = keyof typeof COMPRESSION_PRESETS

/**
 * Custom compression options
 */
export interface CompressionOptions {
  /** Maximum file size in MB */
  maxSizeMB?: number
  /** Maximum width or height in pixels */
  maxWidthOrHeight?: number
  /** Use Web Worker for non-blocking compression */
  useWebWorker?: boolean
  /** Output file type */
  fileType?: 'image/jpeg' | 'image/png' | 'image/webp'
  /** Initial JPEG quality (0-1) */
  initialQuality?: number
  /** Callback for compression progress (0-100) */
  onProgress?: (progress: number) => void
}

/**
 * Compress an image file using a preset or custom options.
 *
 * @param file - The image file to compress
 * @param presetOrOptions - Either a preset name or custom options
 * @returns The compressed file
 *
 * @example
 * // Using a preset
 * const compressed = await compressImage(file, "profilePicture");
 *
 * @example
 * // Using custom options
 * const compressed = await compressImage(file, {
 *   maxSizeMB: 0.3,
 *   maxWidthOrHeight: 600,
 * });
 */
export async function compressImage(
  file: File,
  presetOrOptions: CompressionPreset | CompressionOptions = 'profilePicture',
): Promise<File> {
  // Get options from preset or use provided options
  const options =
    typeof presetOrOptions === 'string'
      ? COMPRESSION_PRESETS[presetOrOptions]
      : {
          ...COMPRESSION_PRESETS.profilePicture,
          ...presetOrOptions,
        }

  // Skip compression for already small files (< 50KB) unless explicitly needed
  if (file.size < 50 * 1024 && !options.maxWidthOrHeight) {
    return file
  }

  try {
    const { default: imageCompression } =
      await import('browser-image-compression')
    const compressed = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: options.useWebWorker ?? true,
      fileType: options.fileType,
      initialQuality: options.initialQuality,
      onProgress: 'onProgress' in options ? options.onProgress : undefined,
    })

    // Log compression results in development
    if (process.env.NODE_ENV === 'development') {
      const originalSize = (file.size / 1024).toFixed(1)
      const compressedSize = (compressed.size / 1024).toFixed(1)
      const reduction = (
        ((file.size - compressed.size) / file.size) *
        100
      ).toFixed(1)
      console.log(
        `[Image Compression] ${originalSize}KB → ${compressedSize}KB (${reduction}% reduction)`,
      )
    }

    return compressed
  } catch (error) {
    console.error('[Image Compression] Failed to compress image:', error)
    // Return original file if compression fails
    return file
  }
}

/**
 * Check if a file is a valid image type that can be compressed.
 *
 * @param file - The file to check
 * @returns Whether the file is a compressible image
 */
export function isCompressibleImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return validTypes.includes(file.type)
}

/**
 * Get human-readable file size string.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string like "1.5 MB" or "256 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}
