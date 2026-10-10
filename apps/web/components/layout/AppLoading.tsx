import { neutralColors, brandColors } from '@ella/ui/colors'

/**
 * Full-page placeholder for the web app: route transitions (`loading.tsx`)
 * and the auth gate while a session is being checked.
 */
export function AppLoading() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100dvh - 75px)',
        gap: 24,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: neutralColors.background.elevated,
          border: `2px solid ${brandColors.primary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 40px ${brandColors.primaryLight}`,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        <svg
          width='32'
          height='32'
          viewBox='0 0 24 24'
          fill='none'
          stroke={brandColors.primary}
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <polygon points='3 11 22 2 13 21 11 13 3 11' />
        </svg>
      </div>
      <div
        style={{
          width: 120,
          height: 4,
          borderRadius: 2,
          backgroundColor: neutralColors.background.elevated,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            borderRadius: 2,
            background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.secondary})`,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  )
}
