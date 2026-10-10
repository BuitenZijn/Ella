import React, { useRef, useCallback, useState } from 'react'
import {
  Animated,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { YStack, Text, semanticColors } from '@ella/ui'
import { Trash2 } from 'lucide-react-native'
import { ActionConfirmModal } from './kit'

const SWIPE_THRESHOLD_RATIO = 0.3

interface SwipeableCardProps {
  /** Content to render inside the card */
  children: React.ReactNode
  /** Called when the swipe + confirmation completes */
  onSwipeAction: () => void
  /** Confirmation dialog title */
  confirmTitle?: string
  /** Confirmation dialog message */
  confirmMessage?: string
  /** Label for the confirm button */
  confirmButtonLabel?: string
}

/**
 * SwipeableCard - A reusable swipeable card component
 *
 * Swipe right to reveal a delete action with confirmation dialog.
 * Can be reused across the app for any swipe-to-delete pattern.
 */
export function SwipeableCard({
  children,
  onSwipeAction,
  confirmTitle = 'Verwijderen bevestigen',
  confirmMessage = 'Weet je het zeker? Dit kan niet ongedaan gemaakt worden.',
  confirmButtonLabel = 'Verwijderen',
}: SwipeableCardProps) {
  const { width: screenWidth } = useWindowDimensions()
  const swipeThreshold = screenWidth * SWIPE_THRESHOLD_RATIO
  const translateX = useRef(new Animated.Value(0)).current
  const [showConfirmation, setShowConfirmation] = useState(false)

  const resetPosition = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start()
  }, [translateX])

  const handleSwipeComplete = useCallback(() => {
    setShowConfirmation(true)
  }, [])

  const handleCancel = useCallback(() => {
    setShowConfirmation(false)
    resetPosition()
  }, [resetPosition])

  const handleConfirm = useCallback(() => {
    setShowConfirmation(false)
    Animated.timing(translateX, {
      toValue: screenWidth,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onSwipeAction())
  }, [onSwipeAction, screenWidth, translateX])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        // Only respond to horizontal swipes (right direction)
        Math.abs(gesture.dx) > 10 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
        gesture.dx > 0,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0) {
          translateX.setValue(gesture.dx)
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > swipeThreshold) {
          handleSwipeComplete()
        } else {
          resetPosition()
        }
      },
      onPanResponderTerminate: () => {
        resetPosition()
      },
    }),
  ).current

  // Interpolate background opacity based on swipe distance.
  const backgroundOpacity = translateX.interpolate({
    inputRange: [0, swipeThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  return (
    <>
      <YStack overflow='hidden' borderRadius='$4'>
        {/* Background action indicator */}
        <Animated.View
          style={[styles.background, { opacity: backgroundOpacity }]}
        >
          <YStack
            flex={1}
            backgroundColor={semanticColors.error.background}
            alignItems='flex-start'
            justifyContent='center'
            paddingLeft='$6'
          >
            <Trash2 size={24} color={semanticColors.error.main} />
            <Text size='$2' color={semanticColors.error.main} weight='semibold'>
              Verwijderen
            </Text>
          </YStack>
        </Animated.View>

        {/* Foreground card */}
        <Animated.View
          style={{ transform: [{ translateX }] }}
          {...panResponder.panHandlers}
        >
          {children}
        </Animated.View>
      </YStack>

      <ActionConfirmModal
        visible={showConfirmation}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        icon={<Trash2 size={24} color={semanticColors.error.main} />}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={confirmButtonLabel}
      />
    </>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
})
