'use client'

import {
  YStack,
  XStack,
  H2,
  Paragraph,
  Card,
  Separator,
  Button,
  ButtonText,
  neutralColors,
  useToast,
} from '@ella/ui'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@ella/backend/api'
import { useRouter } from 'next/navigation'
import { useState, useRef, useCallback } from 'react'
import {
  User,
  Mail,
  Shield,
  Edit2,
  Save,
  X,
  MapPin,
  Phone,
  FileText,
  Lock,
} from 'lucide-react'
import {
  PageHeader,
  RoleBadge,
  EmptyState,
  LoadingState,
  ImageUpload,
  ConfirmDialog,
  type ImageUploadRef,
} from '@/components/common'
import {
  ProfileAvatar,
  EditableField,
  AccountActionsCard,
} from '@/components/user'
import { getErrorMessage } from '@/lib/errorMessage'
import { getSignInHref } from '@/lib/authRedirect'

export default function AccountPage() {
  const { signOut } = useAuthActions()
  const { error: toastError, success: toastSuccess } = useToast()
  const currentUserData = useQuery(api.functions.users.me)
  const currentUser = currentUserData?.user
  const updateProfile = useMutation(api.functions.users.updateProfile)
  const deleteAccount = useMutation(api.functions.users.deleteAccount)
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const profileImageRef = useRef<ImageUploadRef>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  // The box is cropping or compressing a picked photo: saving now would
  // miss it (and after a removal, remove the picture instead).
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  // A new photo was picked, or the current one removed, and not saved yet.
  const [photoChanged, setPhotoChanged] = useState(false)
  // clear() reports a change too; ignore that one.
  const clearingPhotoRef = useRef(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const handlePhotoChange = useCallback(() => {
    if (!clearingPhotoRef.current) setPhotoChanged(true)
  }, [])

  // Also on Cancel: clear() shows the stored picture again, a removed one
  // included.
  const resetPhoto = () => {
    clearingPhotoRef.current = true
    profileImageRef.current?.clear()
    clearingPhotoRef.current = false
    setPhotoChanged(false)
  }

  const handleDeleteAccount = async () => {
    await deleteAccount()
    try {
      await signOut()
    } catch {
      // Every session was already revoked server-side
    }
    // A full navigation: a client-side one would race AuthGate, which sends
    // this now signed-out page to sign-in.
    window.location.replace('/delete-account?deleted=1')
  }

  const handleEdit = () => {
    setEditFirstName(currentUser?.firstName || '')
    setEditLastName(currentUser?.lastName || '')
    setEditBio(currentUser?.bio || '')
    setEditPhone(currentUser?.phone || '')
    setEditLocation(currentUser?.location || '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditFirstName('')
    setEditLastName('')
    setEditBio('')
    setEditPhone('')
    setEditLocation('')
  }

  /**
   * Save the profile photo independently (no need to enter edit mode).
   * `upload()` resolves to the new file, the unchanged current one, or null
   * when the user removed the picture.
   */
  const handlePhotoSave = async () => {
    const imageUpload = profileImageRef.current
    if (!imageUpload || imageUpload.isProcessing) return

    setIsUploadingPhoto(true)
    try {
      const imageStorageId = await imageUpload.upload()
      const currentImage = currentUser?.image ?? null
      if (imageStorageId === null) {
        if (currentImage) {
          await updateProfile({ image: null })
          toastSuccess('Profielfoto verwijderd.')
        }
      } else if (imageStorageId !== currentImage) {
        await updateProfile({ image: imageStorageId })
        toastSuccess('Profielfoto bijgewerkt.')
      }
      resetPhoto()
    } catch (error) {
      console.error('Error saving profile picture:', error)
      toastError(
        getErrorMessage(error, 'De profielfoto kon niet opgeslagen worden'),
      )
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!editFirstName.trim()) {
      toastError('Je voornaam mag niet leeg zijn.')
      return
    }

    setIsSaving(true)
    try {
      // An emptied field is sent as '' and cleared on the server.
      await updateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        bio: editBio.trim(),
        phone: editPhone.trim(),
        location: editLocation.trim(),
      })
      setIsEditing(false)
      toastSuccess('Profiel bijgewerkt.')
    } catch (error) {
      console.error('Error updating profile:', error)
      toastError(
        getErrorMessage(error, 'Het profiel kon niet bijgewerkt worden'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (currentUserData === undefined) {
    return <LoadingState />
  }

  if (!currentUser) {
    return (
      <YStack flex={1} padding='$6' gap='$6' alignItems='center'>
        <YStack width='100%' maxWidth={700}>
          <PageHeader title='Account' description='Je accountgegevens' />
          <EmptyState
            Icon={Lock}
            title='Niet aangemeld'
            description='Meld je aan om je accountgegevens te bekijken.'
            actionLabel='Aanmelden'
            onAction={() => router.push(getSignInHref('/user'))}
          />
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1} padding='$6' gap='$6' alignItems='center'>
      <YStack width='100%' maxWidth={700} gap='$6'>
        <PageHeader
          title='Mijn account'
          description='Beheer je accountgegevens en voorkeuren'
        />

        {/* Profielfoto Card — always editable */}
        <Card size='$5'>
          <YStack gap='$4'>
            <H2 fontSize={24} fontWeight='600'>
              Profielfoto
            </H2>
            <Separator />
            <XStack gap='$6' alignItems='center' flexWrap='wrap'>
              <ProfileAvatar
                imageUrl={currentUserData?.imageUrl}
                fallbackInitial={
                  currentUser?.firstName || currentUser?.email || 'U'
                }
                isEditing={false}
                onImageUpload={() => {}}
              />
              <YStack flex={1} gap='$3' minWidth={200}>
                <ImageUpload
                  ref={profileImageRef}
                  value={currentUser?.image}
                  imageUrl={currentUserData?.imageUrl}
                  preset='profilePicture'
                  cropAspect='square'
                  placeholder='Klik of sleep om een nieuwe foto op te laden'
                  height={160}
                  aspectRatio={1}
                  onFileChange={handlePhotoChange}
                  onProcessingChange={setIsProcessingPhoto}
                />
                {photoChanged && (
                  <XStack gap='$3'>
                    <Button
                      size='$3'
                      variant='success'
                      onPress={handlePhotoSave}
                      disabled={isUploadingPhoto || isProcessingPhoto}
                      opacity={isUploadingPhoto || isProcessingPhoto ? 0.5 : 1}
                      flex={1}
                    >
                      <XStack gap='$2' alignItems='center'>
                        <Save size={14} color={neutralColors.text.inverse} />
                        <ButtonText size='$3'>
                          {isUploadingPhoto
                            ? 'Opladen…'
                            : isProcessingPhoto
                              ? 'Voorbereiden…'
                              : 'Foto opslaan'}
                        </ButtonText>
                      </XStack>
                    </Button>
                    <Button size='$3' variant='ghost' onPress={resetPhoto}>
                      <XStack gap='$2' alignItems='center'>
                        <X size={14} color={neutralColors.text.secondary} />
                        <ButtonText
                          size='$3'
                          color={neutralColors.text.secondary}
                        >
                          Annuleren
                        </ButtonText>
                      </XStack>
                    </Button>
                  </XStack>
                )}
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Profielgegevens Card */}
        <Card size='$5'>
          <YStack gap='$5'>
            <XStack
              justifyContent='space-between'
              alignItems='center'
              flexWrap='wrap'
              gap='$3'
            >
              <H2 fontSize={24} fontWeight='600'>
                Profielgegevens
              </H2>
              {!isEditing && (
                <Button size='$3' variant='primary' onPress={handleEdit}>
                  <XStack gap='$2' alignItems='center'>
                    <Edit2 size={16} color={neutralColors.text.inverse} />
                    <ButtonText size='$3'>Profiel bewerken</ButtonText>
                  </XStack>
                </Button>
              )}
            </XStack>

            <Separator />

            <YStack gap='$4'>
              <EditableField
                icon={User}
                label='Voornaam'
                value={currentUser?.firstName}
                editValue={editFirstName}
                onEditChange={setEditFirstName}
                isEditing={isEditing}
                placeholder='Vul je voornaam in'
              />

              <EditableField
                icon={User}
                label='Achternaam'
                value={currentUser?.lastName}
                editValue={editLastName}
                onEditChange={setEditLastName}
                isEditing={isEditing}
                placeholder='Vul je achternaam in'
              />

              <EditableField
                icon={FileText}
                label='Over mij'
                value={currentUser?.bio}
                editValue={editBio}
                onEditChange={setEditBio}
                isEditing={isEditing}
                placeholder='Vertel iets over jezelf…'
                emptyText='Nog niets ingevuld'
                multiline
              />

              <EditableField
                icon={Phone}
                label='Telefoon'
                value={currentUser?.phone}
                editValue={editPhone}
                onEditChange={setEditPhone}
                isEditing={isEditing}
                placeholder='Vul je telefoonnummer in'
              />

              <EditableField
                icon={MapPin}
                label='Woonplaats'
                value={currentUser?.location}
                editValue={editLocation}
                onEditChange={setEditLocation}
                isEditing={isEditing}
                placeholder='Vul je woonplaats in'
              />

              <EditableField
                icon={Mail}
                label='E-mailadres'
                value={currentUser?.email}
                editValue=''
                onEditChange={() => {}}
                isEditing={isEditing}
                placeholder=''
                emptyText='Geen e-mailadres'
                readOnly
                hint='Je e-mailadres kan je niet wijzigen'
              />

              <YStack gap='$2'>
                <XStack gap='$2' alignItems='center'>
                  <Shield size={16} color={neutralColors.text.secondary} />
                  <Paragraph
                    fontSize={14}
                    fontWeight='600'
                    color={neutralColors.text.secondary}
                  >
                    Rol
                  </Paragraph>
                </XStack>
                <XStack>
                  <RoleBadge role={currentUser?.role || 'user'} />
                </XStack>
              </YStack>

              {isEditing && (
                <XStack gap='$3' marginTop='$2'>
                  <Button
                    size='$4'
                    variant='success'
                    onPress={handleSave}
                    disabled={isSaving}
                    opacity={isSaving ? 0.5 : 1}
                    flex={1}
                  >
                    <XStack gap='$2' alignItems='center'>
                      <Save size={16} color={neutralColors.text.inverse} />
                      <ButtonText>
                        {isSaving ? 'Opslaan…' : 'Wijzigingen opslaan'}
                      </ButtonText>
                    </XStack>
                  </Button>
                  <Button
                    size='$4'
                    variant='ghost'
                    onPress={handleCancel}
                    disabled={isSaving}
                  >
                    <XStack gap='$2' alignItems='center'>
                      <X size={16} color={neutralColors.text.secondary} />
                      <Paragraph
                        color={neutralColors.text.secondary}
                        fontWeight='600'
                      >
                        Annuleren
                      </Paragraph>
                    </XStack>
                  </Button>
                </XStack>
              )}
            </YStack>
          </YStack>
        </Card>

        <AccountActionsCard
          // Like the navbar: the sign-out page unloads this page's live
          // queries before the session goes.
          onSignOut={() => router.push('/sign-out')}
          onDeleteAccount={() => setDeleteConfirmOpen(true)}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title='Account verwijderen'
          description='Dit verwijdert je account en al je gegevens definitief. Je wordt op al je toestellen afgemeld. Dit kan niet ongedaan gemaakt worden.'
          confirmText='DELETE'
          confirmLabel='Mijn account verwijderen'
          variant='danger'
          onConfirm={handleDeleteAccount}
        />
      </YStack>
    </YStack>
  )
}
