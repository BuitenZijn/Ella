'use client'

import {
  YStack,
  XStack,
  Text,
  Dialog,
  Button,
  ButtonText,
  neutralColors,
  StyledInput,
  useToast,
} from '@ella/ui'
import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/errorMessage'

export type ConfirmDialogVariant = 'danger' | 'warning' | 'success' | 'primary'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel: string
  confirmText?: string // Text user must type to confirm
  variant?: ConfirmDialogVariant
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmText,
  variant = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  const { error: toastError } = useToast()
  const [inputText, setInputText] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  // The dialog opens from code, not a Dialog.Trigger, so Tamagui has no
  // trigger to hand focus back to on close. Remember what had focus as it
  // opens: read while rendering, because the native <dialog> moves focus
  // inside before any effect of ours runs.
  const [wasOpen, setWasOpen] = useState(open)
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && typeof document !== 'undefined') {
      const active = document.activeElement
      setReturnFocus(
        active instanceof HTMLElement && active !== document.body
          ? active
          : null,
      )
    }
  }

  const canConfirm = !confirmText || inputText === confirmText

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setInputText('')
      onOpenChange(nextOpen)
    },
    [onOpenChange],
  )

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) {
      toastError(`Typ ${confirmText} om te bevestigen.`)
      return
    }

    setIsConfirming(true)
    try {
      await onConfirm()
      onOpenChange(false)
      setInputText('')
    } catch (error) {
      console.error('Confirmation action failed:', error)
      toastError(getErrorMessage(error, 'Dat is niet gelukt. Probeer opnieuw.'))
    } finally {
      setIsConfirming(false)
    }
  }, [canConfirm, confirmText, onConfirm, onOpenChange, toastError])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setInputText('')
  }, [onOpenChange])

  return (
    <Dialog modal open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key='overlay'
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          key='content'
          // A destructive confirmation interrupts: announce it as an alert
          role={variant === 'danger' ? 'alertdialog' : 'dialog'}
          onCloseAutoFocus={event => {
            if (!returnFocus?.isConnected) return
            event.preventDefault()
            returnFocus.focus()
          }}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap='$4'
          padding='$6'
          backgroundColor={neutralColors.background.elevated}
        >
          <Dialog.Title fontSize={24} fontWeight='700'>
            {title}
          </Dialog.Title>
          <Dialog.Description
            fontSize={16}
            color={neutralColors.text.secondary}
          >
            {description}
          </Dialog.Description>

          {confirmText && (
            <YStack gap='$2'>
              <Text variant='muted'>
                Typ <strong>{confirmText}</strong> om te bevestigen:
              </Text>
              <StyledInput
                placeholder={confirmText}
                value={inputText}
                onChangeText={setInputText}
                size='$4'
                autoFocus
                variant='elevated'
              />
            </YStack>
          )}

          <XStack gap='$3' justifyContent='flex-end'>
            <Dialog.Close displayWhenAdapted asChild>
              <Button
                variant='ghost'
                onPress={handleClose}
                disabled={isConfirming}
              >
                <ButtonText>Annuleren</ButtonText>
              </Button>
            </Dialog.Close>
            <Button
              variant={variant}
              onPress={handleConfirm}
              disabled={!canConfirm || isConfirming}
              opacity={!canConfirm || isConfirming ? 0.5 : 1}
            >
              {isConfirming ? (
                <XStack alignItems='center' gap='$2'>
                  <Loader2
                    size={16}
                    color={neutralColors.text.onFill}
                    className='animate-spin'
                    aria-hidden
                  />
                  <ButtonText>Even geduld…</ButtonText>
                </XStack>
              ) : (
                <ButtonText>{confirmLabel}</ButtonText>
              )}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
