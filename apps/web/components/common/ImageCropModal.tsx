'use client'

import { useState, useRef, useCallback, useEffect, useId } from 'react'
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
// CSS imported at module level — this file is lazy-loaded via next/dynamic in ImageUpload.tsx
import {
  YStack,
  XStack,
  Button,
  ButtonText,
  Text,
  neutralColors,
} from '@ella/ui'
import { Check, X, RotateCcw } from 'lucide-react'
import { listenForCropKeys } from '@/lib/cropModalKeys'

/**
 * Predefined crop aspect ratios matching how images are displayed across the app.
 *
 * - `square` (1:1): Profile pictures (circular avatar), image puzzle (NxN grid)
 * - `questCover` (16:9): Quest hero/cards on web & mobile
 * - `landscape` (16:10): POI/waypoint images (full-width, fixed height)
 * - `free`: No constraint — user chooses any shape
 */
export const CROP_PRESETS = {
  /** 1:1 — Profile pictures, image puzzle */
  square: { aspect: 1, label: 'Vierkant (1:1)' },
  /** 16:9 — Quest cover images */
  questCover: { aspect: 16 / 9, label: 'Breed (16:9)' },
  /** 16:10 — POI/waypoint photos */
  landscape: { aspect: 16 / 10, label: 'Liggend (16:10)' },
  /** Free-form — no constraint */
  free: { aspect: undefined, label: 'Vrij' },
} as const

export type CropPreset = keyof typeof CROP_PRESETS

export interface ImageCropModalProps {
  /** The image source URL (object URL from file selection) */
  imageSrc: string
  /** Crop preset or custom aspect ratio */
  cropAspect?: CropPreset | number
  /** Called with the cropped blob when user confirms */
  onCropComplete: (croppedBlob: Blob) => void
  /** Called when user cancels */
  onCancel: () => void
  /** Output MIME type */
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp'
  /** Output quality (0-1, for JPEG/WebP) */
  outputQuality?: number
}

/**
 * Get a centered crop for the given aspect ratio on image load.
 */
function getCenteredCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  )
}

/**
 * Extract the cropped region from a loaded image using an offscreen canvas.
 */
function cropImageToBlob(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  outputType: string,
  outputQuality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Scale to the natural image size (handle CSS scaling)
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  canvas.width = Math.floor(pixelCrop.width * scaleX)
  canvas.height = Math.floor(pixelCrop.height * scaleY)

  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create cropped image blob'))
      },
      outputType,
      outputQuality,
    )
  })
}

/**
 * ImageCropModal — Full-screen overlay for cropping images before upload.
 *
 * Uses `react-image-crop` for the crop interaction. Produces a cropped Blob
 * that feeds into the existing compression + upload pipeline.
 */
export function ImageCropModal({
  imageSrc,
  cropAspect,
  onCropComplete,
  onCancel,
  outputType = 'image/jpeg',
  outputQuality = 0.92,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Resolve aspect ratio from preset or number
  const resolvedAspect =
    cropAspect === undefined
      ? undefined
      : typeof cropAspect === 'number'
        ? cropAspect
        : CROP_PRESETS[cropAspect]?.aspect

  // Initialize crop region when image loads
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      if (resolvedAspect) {
        const initialCrop = getCenteredCrop(width, height, resolvedAspect)
        setCrop(initialCrop)
      } else {
        // Free-form: start with 90% centered crop
        setCrop(centerCrop({ unit: '%', width: 90, height: 90 }, width, height))
      }
    },
    [resolvedAspect],
  )

  // Reset crop to centered
  const handleReset = useCallback(() => {
    if (!imgRef.current) return
    const { width, height } = imgRef.current
    if (resolvedAspect) {
      setCrop(getCenteredCrop(width, height, resolvedAspect))
    } else {
      setCrop(centerCrop({ unit: '%', width: 90, height: 90 }, width, height))
    }
  }, [resolvedAspect])

  // Produce cropped blob on confirm
  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return

    setIsProcessing(true)
    try {
      const blob = await cropImageToBlob(
        imgRef.current,
        completedCrop,
        outputType,
        outputQuality,
      )
      onCropComplete(blob)
    } catch (error) {
      console.error('Failed to crop image:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [completedCrop, outputType, outputQuality, onCropComplete])

  // Escape cancels, Enter crops, Tab stays inside — ahead of any dialog the
  // modal opened over (see listenForCropKeys).
  useEffect(
    () =>
      listenForCropKeys(window, {
        onCancel,
        onConfirm: handleConfirm,
        focusables: () =>
          Array.from(
            dialogRef.current?.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ) ?? [],
          ),
      }),
    [onCancel, handleConfirm],
  )

  // Move focus into the modal while it is open, and back where it was after.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  return (
    <div
      ref={dialogRef}
      role='dialog'
      aria-modal='true'
      aria-labelledby={titleId}
      tabIndex={-1}
      style={{
        outline: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
    >
      {/* Header */}
      <XStack
        paddingHorizontal='$4'
        paddingVertical='$3'
        justifyContent='space-between'
        alignItems='center'
        backgroundColor='rgba(0,0,0,0.5)'
      >
        <Text id={titleId} size='$4' weight='semibold' color='white'>
          Afbeelding bijsnijden
        </Text>
        <XStack gap='$2'>
          <Button
            size='$3'
            variant='ghost'
            onPress={handleReset}
            disabled={isProcessing}
          >
            <XStack gap='$1' alignItems='center'>
              <RotateCcw size={14} color='white' />
              <ButtonText size='$2' color='white'>
                Herstellen
              </ButtonText>
            </XStack>
          </Button>
        </XStack>
      </XStack>

      {/* Crop area */}
      <YStack
        flex={1}
        alignItems='center'
        justifyContent='center'
        padding='$4'
        overflow='hidden'
      >
        <div
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={c => setCompletedCrop(c)}
            aspect={resolvedAspect}
            minWidth={50}
            minHeight={50}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt='Voorbeeld'
              onLoad={handleImageLoad}
              style={{
                maxWidth: '80vw',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          </ReactCrop>
        </div>
      </YStack>

      {/* Aspect ratio label */}
      {cropAspect &&
        typeof cropAspect === 'string' &&
        CROP_PRESETS[cropAspect] && (
          <XStack justifyContent='center' paddingBottom='$2'>
            <Text size='$2' color={neutralColors.text.muted}>
              Verhouding: {CROP_PRESETS[cropAspect].label}
            </Text>
          </XStack>
        )}

      {/* Footer actions */}
      <XStack
        paddingHorizontal='$4'
        paddingVertical='$3'
        justifyContent='flex-end'
        gap='$3'
        backgroundColor='rgba(0,0,0,0.5)'
      >
        <Button
          size='$3'
          variant='ghost'
          onPress={onCancel}
          disabled={isProcessing}
        >
          <XStack gap='$1' alignItems='center'>
            <X size={16} color='white' />
            <ButtonText size='$3' color='white'>
              Annuleren
            </ButtonText>
          </XStack>
        </Button>
        <Button
          size='$3'
          variant='primary'
          onPress={handleConfirm}
          disabled={isProcessing || !completedCrop}
        >
          <XStack gap='$1' alignItems='center'>
            <Check size={16} color={neutralColors.text.inverse} />
            <ButtonText size='$3'>
              {isProcessing ? 'Bijsnijden…' : 'Bijsnijden'}
            </ButtonText>
          </XStack>
        </Button>
      </XStack>
    </div>
  )
}
