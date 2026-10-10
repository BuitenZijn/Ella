import React from 'react'
import { Alert, Linking, ScrollView } from 'react-native'
import {
  YStack,
  Text,
  XStack,
  Button,
  ButtonText,
  MicroLabel,
  neutralColors,
} from '@ella/ui'
import { useNavigation } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { MainStackParamList } from '../../../navigation/types'
import { useAuthActions } from '@convex-dev/auth/react'
import * as Application from 'expo-application'
import {
  ChevronRight,
  Shield,
  Info,
  User,
  Lock,
  Camera,
  UserRoundCog,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { AppShell } from '../../../components/shell'
import { SITE_URL } from '../../../lib/config/siteUrl'

type NavigationProp = StackNavigationProp<MainStackParamList>

function SettingsRow({
  Icon,
  label,
  onPress,
  hint,
}: {
  Icon: LucideIcon
  label: string
  onPress: () => void
  hint?: string
}) {
  return (
    <Button
      variant='ghost-row'
      size='$3'
      onPress={onPress}
      icon={<Icon size={18} color={neutralColors.text.secondary} />}
      iconAfter={<ChevronRight size={18} color={neutralColors.text.muted} />}
      accessibilityHint={hint}
    >
      <ButtonText flex={1} textAlign='left'>
        {label}
      </ButtonText>
    </Button>
  )
}

/**
 * SettingsScreen - profile, account and app information
 */
export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { signOut } = useAuthActions()
  const tabBarHeight = useBottomTabBarHeight()

  const appVersion = Application.nativeApplicationVersion ?? 'onbekend'
  const buildNumber = Application.nativeBuildVersion ?? ''

  const handleLogout = () => {
    Alert.alert('Afmelden', 'Wil je je afmelden?', [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Afmelden',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ])
  }

  return (
    <AppShell title='Instellingen' showBack={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}>
        <YStack flex={1} padding='$4' gap='$4'>
          <YStack gap='$2'>
            <MicroLabel paddingHorizontal='$1'>Profiel</MicroLabel>
            <SettingsRow
              Icon={User}
              label='Naam'
              onPress={() => navigation.navigate('EditName')}
            />
            <SettingsRow
              Icon={Lock}
              label='Wachtwoord'
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <SettingsRow
              Icon={Camera}
              label='Profielfoto'
              onPress={() => navigation.navigate('ProfilePicture')}
            />
          </YStack>

          <YStack gap='$2'>
            <MicroLabel paddingHorizontal='$1'>Account</MicroLabel>
            <SettingsRow
              Icon={UserRoundCog}
              label='Account & privacy'
              onPress={() => navigation.navigate('AccountPrivacy')}
            />
            <SettingsRow
              Icon={Shield}
              label='Privacybeleid'
              hint='Opent in de browser'
              onPress={() => Linking.openURL(`${SITE_URL}/privacy`)}
            />
          </YStack>

          <Button variant='danger' onPress={handleLogout}>
            <ButtonText>Afmelden</ButtonText>
          </Button>

          <YStack alignItems='center' paddingTop='$4' gap='$1'>
            <XStack alignItems='center' gap='$2'>
              <Info size={14} color={neutralColors.text.muted} />
              <Text size='$2' variant='muted'>
                Ella v{appVersion}
                {buildNumber ? ` (${buildNumber})` : ''}
              </Text>
            </XStack>
            <Text size='$1' variant='muted'>
              Leren door te spelen
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </AppShell>
  )
}

export default SettingsScreen
