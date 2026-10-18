import React from 'react'
import { Text, type TextProps } from '@ella/ui'

interface EmojiProps extends Omit<TextProps, 'fontSize' | 'lineHeight'> {
  size: number
  children: React.ReactNode
}

/**
 * An emoji at a given size. Text inherits the body line height (~20px), which
 * clips anything bigger, so the line height follows the size here.
 */
export function Emoji({ size, children, ...rest }: EmojiProps) {
  return (
    <Text
      fontSize={size}
      lineHeight={Math.ceil(size * 1.25)}
      textAlign='center'
      allowFontScaling={false}
      {...rest}
    >
      {children}
    </Text>
  )
}
