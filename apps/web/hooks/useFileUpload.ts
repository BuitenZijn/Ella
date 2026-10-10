'use client'

import { useCallback, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/dataModel'
import { getErrorMessage } from '@/lib/errorMessage'

interface UseFileUploadResult {
  /** Upload a single file to Convex storage */
  uploadFile: (file: File) => Promise<Id<'_storage'>>
  /** Upload multiple files in parallel */
  uploadFiles: (files: File[]) => Promise<Id<'_storage'>[]>
  /** Whether any upload is currently in progress */
  isUploading: boolean
  /** Error message if last upload failed */
  error: string | null
}

/**
 * Hook for uploading files to Convex storage
 *
 * Single source of truth for file upload logic.
 * Handles generating upload URLs and performing the upload.
 *
 * @example
 * ```tsx
 * const { uploadFile, isUploading } = useFileUpload();
 *
 * const handleSave = async () => {
 *   const storageId = await uploadFile(myFile);
 *   // Use storageId in your mutation
 * };
 * ```
 */
export function useFileUpload(): UseFileUploadResult {
  const generateUploadUrl = useMutation(api.functions.users.generateUploadUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(
    async (file: File): Promise<Id<'_storage'>> => {
      setError(null)
      setIsUploading(true)

      try {
        const uploadUrl = await generateUploadUrl()
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!response.ok) {
          throw new Error(`Opladen mislukt (status ${response.status})`)
        }

        const { storageId } = await response.json()
        return storageId as Id<'_storage'>
      } catch (err) {
        const message = getErrorMessage(err, 'Opladen mislukt')
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [generateUploadUrl],
  )

  const uploadFiles = useCallback(
    async (files: File[]): Promise<Id<'_storage'>[]> => {
      if (files.length === 0) return []

      setError(null)
      setIsUploading(true)

      try {
        // Upload all files in parallel
        const results = await Promise.all(
          files.map(async file => {
            const uploadUrl = await generateUploadUrl()
            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers: { 'Content-Type': file.type },
              body: file,
            })

            if (!response.ok) {
              throw new Error(`Opladen mislukt (status ${response.status})`)
            }

            const { storageId } = await response.json()
            return storageId as Id<'_storage'>
          }),
        )
        return results
      } catch (err) {
        const message = getErrorMessage(err, 'Opladen mislukt')
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [generateUploadUrl],
  )

  return {
    uploadFile,
    uploadFiles,
    isUploading,
    error,
  }
}
