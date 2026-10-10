'use client'

import {
  YStack,
  XStack,
  Avatar,
  AvatarText,
  Button,
  ButtonText,
  neutralColors,
} from '@ella/ui'
import { Camera } from 'lucide-react'
import { useRef } from 'react'

export interface ProfileAvatarProps {
  imageUrl: string | null | undefined
  fallbackInitial: string
  isEditing: boolean
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function ProfileAvatar({
  imageUrl,
  fallbackInitial,
  isEditing,
  onImageUpload,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <YStack gap='$3' alignItems='center'>
      <Avatar variant='primary' size='$8'>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt='Profiel'
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <AvatarText size='$8'>
            {fallbackInitial.charAt(0).toUpperCase()}
          </AvatarText>
        )}
      </Avatar>
      {isEditing && (
        <>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={onImageUpload}
            style={{ display: 'none' }}
          />
          <Button
            size='$3'
            variant='primary'
            onPress={() => fileInputRef.current?.click()}
          >
            <XStack gap='$2' alignItems='center'>
              <Camera size={16} color={neutralColors.text.inverse} />
              <ButtonText size='$3'>Foto wijzigen</ButtonText>
            </XStack>
          </Button>
        </>
      )}
    </YStack>
  )
}
