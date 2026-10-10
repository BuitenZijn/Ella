'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  YStack,
  Paragraph,
  Spinner,
  brandColors,
  neutralColors,
} from '@ella/ui'
import type { Id } from '@ella/backend/dataModel'
import {
  compressImage,
  isCompressibleImage,
  type CompressionPreset,
} from '@/lib/imageCompression'
import { useFileUpload } from '@/hooks/useFileUpload'
import {
  imageWithoutUpload,
  isImageRemoved,
  nextRemovedValue,
} from '@/lib/imageUploadState'
import { Upload, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { CropPreset } from './ImageCropModal'

// Loaded when a crop starts: react-image-crop and its CSS stay off the pages
// that show an upload box but never crop.
const ImageCropModal = dynamic(
  () =>
    import('./ImageCropModal').then(mod => ({ default: mod.ImageCropModal })),
  { ssr: false },
)

/**
 * Ref handle exposed by ImageUpload for imperative upload control
 */
export interface ImageUploadRef {
  /**
   * Upload the currently selected image to Convex storage.
   * Resolves to the new storage ID when a new file was selected, to the
   * existing `value` when nothing changed, and to null when there is no
   * image — including when the creator removed the existing one, which the
   * caller should then remove too.
   */
  upload: () => Promise<Id<'_storage'> | null>
  /** Get the pending compressed file without uploading (for deferred upload) */
  getPendingFile: () => File | null
  /** Whether a new file has been selected (pending upload) */
  hasNewFile: boolean
  /** Whether the existing `value` was removed and nothing replaced it */
  isRemoved: boolean
  /** Whether upload is in progress */
  isUploading: boolean
  /**
   * Whether the box is busy with a file: cropping, compressing or
   * uploading. `upload()` called meanwhile would miss the new file.
   */
  isProcessing: boolean
  /** Clear the selected file and preview */
  clear: () => void
}

export interface ImageUploadProps {
  /** Current storage ID (if image already uploaded) */
  value?: Id<'_storage'> | null
  /** Current image URL (for preview of existing image) */
  imageUrl?: string | null
  /** Callback when file is selected or cleared (for parent awareness, not upload) */
  onFileChange?: (hasFile: boolean) => void
  /**
   * Called when the creator removes the image shown (the existing one or a
   * picked file). `upload()` resolves to null afterwards unless another
   * file is picked.
   */
  onRemove?: () => void
  /** Called when the box starts or stops being busy (see `isProcessing`) */
  onProcessingChange?: (processing: boolean) => void
  /** Compression preset to use */
  preset?: CompressionPreset
  /** Placeholder text */
  placeholder?: string
  /** Aspect ratio for the upload area (width/height) */
  aspectRatio?: number
  /** Whether upload is disabled */
  disabled?: boolean
  /** Height of the upload area */
  height?: number
  /**
   * Crop aspect ratio applied before compression.
   * Use a CropPreset name ('square' | 'questCover' | 'landscape' | 'free')
   * or a custom numeric ratio (width/height).
   * When set, a crop modal appears after file selection.
   */
  cropAspect?: CropPreset | number
}

type UploadState = 'idle' | 'compressing' | 'uploading' | 'error'

/**
 * ImageUpload - Reusable image upload component with compression
 *
 * Features:
 * - Drag-and-drop support
 * - Click to select file
 * - Image compression on file select (for instant preview)
 * - Deferred upload via imperative handle (call ref.upload() when ready)
 * - Preview of selected/uploaded image
 * - Remove functionality
 *
 * Usage:
 * ```tsx
 * const imageRef = useRef<ImageUploadRef>(null);
 *
 * const handleSave = async () => {
 *   const storageId = await imageRef.current?.upload();
 *   // Use storageId in your mutation
 * };
 *
 * <ImageUpload ref={imageRef} value={existingStorageId} imageUrl={existingUrl} />
 * ```
 */
export const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(
  function ImageUpload(
    {
      value,
      imageUrl,
      onFileChange,
      onRemove,
      onProcessingChange,
      preset = 'questCover',
      placeholder = 'Klik of sleep om een afbeelding op te laden',
      aspectRatio,
      disabled = false,
      height = 200,
      cropAspect,
    },
    ref,
  ) {
    const { uploadFile, isUploading: isUploadingFile } = useFileUpload()

    const [uploadState, setUploadState] = useState<UploadState>('idle')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Crop modal state
    const [cropSrc, setCropSrc] = useState<string | null>(null)
    const [rawFileForCrop, setRawFileForCrop] = useState<File | null>(null)

    // The existing value the creator removed. Only that value counts as
    // removed: a new value from the parent shows again.
    const [removedValue, setRemovedValue] = useState<Id<'_storage'> | null>(
      null,
    )
    const removed = isImageRemoved(removedValue, value)

    // The display URL is either the local preview or the existing image URL
    const displayUrl = previewUrl || (removed ? null : imageUrl)

    const isWorking =
      uploadState === 'compressing' || uploadState === 'uploading'
    const isProcessing = isWorking || cropSrc !== null
    useEffect(() => {
      onProcessingChange?.(isProcessing)
    }, [isProcessing, onProcessingChange])
    // Gone mid-way (the box unmounted): nothing is processing any more.
    useEffect(() => () => onProcessingChange?.(false), [onProcessingChange])

    // Expose imperative handle for parent to trigger upload
    useImperativeHandle(
      ref,
      () => ({
        upload: async (): Promise<Id<'_storage'> | null> => {
          // Nothing new picked: the image it was given, or null once the
          // creator removed it.
          if (!pendingFile) {
            return imageWithoutUpload(value, removedValue)
          }

          // Upload the pending file using the shared hook
          try {
            setUploadState('uploading')
            const storageId = await uploadFile(pendingFile)
            setUploadState('idle')
            // Clear pending file after successful upload
            setPendingFile(null)
            return storageId
          } catch (error) {
            console.error('Error uploading image:', error)
            setErrorMessage(
              'De afbeelding kon niet opgeladen worden. Probeer opnieuw.',
            )
            setUploadState('error')
            throw error
          }
        },
        getPendingFile: () => pendingFile,
        hasNewFile: !!pendingFile,
        isRemoved: removed && !pendingFile,
        isUploading: uploadState === 'uploading' || isUploadingFile,
        isProcessing,
        clear: () => {
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
          }
          setPreviewUrl(null)
          setPendingFile(null)
          setErrorMessage(null)
          setUploadState('idle')
          // The image it was given shows again.
          setRemovedValue(prev => nextRemovedValue(prev, { type: 'clear' }))
          onFileChange?.(false)
        },
      }),
      [
        pendingFile,
        value,
        removedValue,
        removed,
        uploadFile,
        isUploadingFile,
        previewUrl,
        uploadState,
        isProcessing,
        onFileChange,
      ],
    )

    /** Compress and store a file (called after optional crop step) */
    const processFile = useCallback(
      async (file: File) => {
        setUploadState('compressing')
        let compressedFile: File
        try {
          compressedFile = await compressImage(file, preset)
        } catch (error) {
          console.error('Error compressing image:', error)
          setErrorMessage(
            'De afbeelding kon niet verkleind worden. Probeer opnieuw.',
          )
          setUploadState('error')
          return
        }

        // Create preview from compressed file
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        const objectUrl = URL.createObjectURL(compressedFile)
        setPreviewUrl(objectUrl)

        // Store compressed file for later upload via ref.upload()
        setPendingFile(compressedFile)
        setUploadState('idle')
        onFileChange?.(true)
      },
      [preset, onFileChange, previewUrl],
    )

    const handleFile = useCallback(
      async (file: File) => {
        // Validate file type
        if (!isCompressibleImage(file)) {
          setErrorMessage('Kies een afbeelding (JPG, PNG, WebP of GIF)')
          setUploadState('error')
          return
        }

        setErrorMessage(null)

        // If crop is enabled, show the crop modal before compressing
        if (cropAspect !== undefined) {
          const objectUrl = URL.createObjectURL(file)
          setCropSrc(objectUrl)
          setRawFileForCrop(file)
          return
        }

        // No crop — compress directly
        await processFile(file)
      },
      [cropAspect, processFile],
    )

    /** Handle crop completion — convert the cropped blob to a File and compress */
    const handleCropComplete = useCallback(
      async (croppedBlob: Blob) => {
        // Clean up crop state
        if (cropSrc) URL.revokeObjectURL(cropSrc)
        setCropSrc(null)
        setRawFileForCrop(null)

        // Convert blob to File (preserving a sensible name and type)
        const fileName = rawFileForCrop?.name ?? 'cropped-image.jpg'
        const croppedFile = new File([croppedBlob], fileName, {
          type: croppedBlob.type || 'image/jpeg',
        })

        await processFile(croppedFile)
      },
      [cropSrc, rawFileForCrop, processFile],
    )

    /** Handle crop cancel */
    const handleCropCancel = useCallback(() => {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
      setRawFileForCrop(null)
    }, [cropSrc])

    const handleClick = () => {
      // After a rejected file ('error') the box takes another one.
      if (!disabled && !isProcessing) {
        fileInputRef.current?.click()
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Keys on the remove button are the button's own.
      if (event.target !== event.currentTarget) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFile(file)
      }
      // Reset input so same file can be selected again
      event.target.value = ''
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)

      if (disabled || isProcessing) return

      const file = event.dataTransfer.files?.[0]
      if (file) {
        handleFile(file)
      }
    }

    const handleRemove = (event: React.MouseEvent) => {
      event.stopPropagation()
      // Revoke the object URL to free memory
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setPendingFile(null)
      setErrorMessage(null)
      setUploadState('idle')
      // The existing image goes too: upload() resolves to null from now on.
      setRemovedValue(prev => nextRemovedValue(prev, { type: 'remove', value }))
      onFileChange?.(false)
      onRemove?.()
    }

    const hasImage = !!displayUrl || (!!value && !removed)

    const getBorderColor = () => {
      if (isDragging) return brandColors.primary
      if (uploadState === 'error') return brandColors.destructive
      return neutralColors.border.default
    }

    const getBackgroundColor = () => {
      if (isDragging) return `${brandColors.primary}10`
      if (disabled) return neutralColors.background.hover
      return neutralColors.background.elevated
    }

    return (
      <YStack gap='$2'>
        {/* Use native div for drag-and-drop support */}
        <div
          role='button'
          tabIndex={disabled ? -1 : 0}
          aria-label={
            hasImage ? `Afbeelding vervangen. ${placeholder}` : placeholder
          }
          aria-disabled={disabled || isProcessing || undefined}
          aria-busy={isProcessing || undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            height: aspectRatio ? undefined : height,
            aspectRatio: aspectRatio ? String(aspectRatio) : undefined,
            borderRadius: 12,
            border: `2px dashed ${getBorderColor()}`,
            backgroundColor: getBackgroundColor(),
            overflow: 'hidden',
            cursor: disabled ? 'not-allowed' : isWorking ? 'wait' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color 0.2s, background-color 0.2s',
          }}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp,image/gif'
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={disabled}
          />

          {/* Image preview - using img for blob URLs which don't work with next/image */}
          {displayUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt='Voorbeeld'
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: 'rgba(0,0,0,0.05)',
              }}
            />
          )}

          {/* Overlay for processing or empty state */}
          {(!displayUrl || isWorking) && (
            <YStack
              position='absolute'
              top={0}
              left={0}
              right={0}
              bottom={0}
              alignItems='center'
              justifyContent='center'
              backgroundColor={displayUrl ? 'rgba(0,0,0,0.5)' : 'transparent'}
            >
              {isWorking ? (
                <YStack alignItems='center' gap='$2'>
                  <Spinner size='large' color={brandColors.primary} />
                  <Paragraph
                    size='$3'
                    color={displayUrl ? 'white' : neutralColors.text.muted}
                  >
                    {uploadState === 'compressing' ? 'Verkleinen…' : 'Opladen…'}
                  </Paragraph>
                </YStack>
              ) : (
                <YStack alignItems='center' gap='$2'>
                  <Upload size={32} color={neutralColors.text.muted} />
                  <Paragraph
                    size='$3'
                    color={neutralColors.text.muted}
                    textAlign='center'
                  >
                    {placeholder}
                  </Paragraph>
                  <Paragraph size='$2' color={neutralColors.text.muted}>
                    JPG, PNG, WebP, GIF
                  </Paragraph>
                </YStack>
              )}
            </YStack>
          )}

          {/* Remove button */}
          {hasImage && !isProcessing && !disabled && (
            <button
              type='button'
              aria-label='Afbeelding verwijderen'
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = brandColors.destructive
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'
              }}
            >
              <X size={16} color='white' />
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <Paragraph size='$2' color={brandColors.destructive}>
            {errorMessage}
          </Paragraph>
        )}

        {/* Crop modal */}
        {cropSrc && (
          <ImageCropModal
            imageSrc={cropSrc}
            cropAspect={cropAspect}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </YStack>
    )
  },
)
