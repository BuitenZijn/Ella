import React from 'react'
import { View } from 'react-native'
import type { ClockTime } from '@ella/backend/types'
import { Text, cardColors, neutralColors } from '@ella/ui'

/**
 * A bar from the clock's centre outwards, turned `angle` degrees clockwise
 * from 12. The view is twice the bar's length and centred on the clock, so
 * it turns around the centre; only its top half is painted.
 */
function Spoke({
  size,
  length,
  width,
  angle,
  color,
  inset = 0,
}: {
  size: number
  length: number
  width: number
  angle: number
  color: string
  /** Start this far from the centre (ticks sit near the rim) */
  inset?: number
}) {
  const reach = length + inset
  return (
    <View
      pointerEvents='none'
      style={{
        position: 'absolute',
        left: size / 2 - width / 2,
        top: size / 2 - reach,
        width,
        height: reach * 2,
        transform: [{ rotate: `${angle}deg` }],
      }}
    >
      <View
        style={{
          height: length,
          backgroundColor: color,
          borderRadius: width / 2,
        }}
      />
    </View>
  )
}

/** A clock face with numbers, minute ticks and two hands. */
export function AnalogClock({ time, size }: { time: ClockTime; size: number }) {
  const r = size / 2
  const ink = cardColors.background
  const numberSize = Math.round(size * 0.09)
  return (
    <View
      accessibilityRole='image'
      accessibilityLabel='Een klok'
      style={{
        width: size,
        height: size,
        borderRadius: r,
        borderWidth: 6,
        borderColor: ink,
        backgroundColor: neutralColors.background.card,
      }}
    >
      {/* Children start inside the border; this layer covers the whole
          clock, so its centre is at (r, r). */}
      <View
        style={{
          position: 'absolute',
          left: -6,
          top: -6,
          width: size,
          height: size,
        }}
      >
        {Array.from({ length: 60 }, (_, i) => {
          const length = i % 5 === 0 ? r * 0.1 : r * 0.05
          return (
            <Spoke
              key={i}
              size={size}
              length={length}
              width={i % 5 === 0 ? 3 : 1.5}
              angle={i * 6}
              color={ink}
              inset={r - 10 - length}
            />
          )
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1
          const a = (n * 30 * Math.PI) / 180
          const at = r * 0.72
          const box = numberSize * 2
          return (
            <Text
              key={n}
              position='absolute'
              left={r + at * Math.sin(a) - box / 2}
              top={r - at * Math.cos(a) - box / 2}
              width={box}
              height={box}
              fontSize={numberSize}
              lineHeight={box}
              textAlign='center'
              weight='bold'
              color={ink}
              allowFontScaling={false}
            >
              {n}
            </Text>
          )
        })}
        <Spoke
          size={size}
          length={r * 0.5}
          width={8}
          angle={(time.hour % 12) * 30 + time.minute * 0.5}
          color={ink}
        />
        <Spoke
          size={size}
          length={r * 0.78}
          width={5}
          angle={time.minute * 6}
          color={neutralColors.text.primary}
        />
        <View
          style={{
            position: 'absolute',
            left: r - 9,
            top: r - 9,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: ink,
          }}
        />
      </View>
    </View>
  )
}
