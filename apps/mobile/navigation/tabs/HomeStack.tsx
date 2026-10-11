import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { defaultScreenOptions } from '../screenOptions'
import { screenBoundaryLayout } from '../../components/ScreenBoundary'
import type { HomeStackParamList } from '../types'
import {
  ActiveChildProvider,
  AddChildScreen,
  CraftsScreen,
  DinoQuizScreen,
  GamesHomeScreen,
  MaaltafelScreen,
  MathScreen,
  MemoryScreen,
  PlanetPuzzleScreen,
  ResultsScreen,
} from '../../features/games'

/**
 * Routes in this stack that hide the bottom tab bar.
 *
 * Declared next to the screens themselves so adding a full-bleed screen
 * is a one-file change; MainNavigator aggregates these. The games get the
 * whole screen.
 */
export const fullScreenRoutes = [
  'Maaltafel',
  'Math',
  'DinoQuiz',
  'Memory',
  'PlanetPuzzle',
] as const

const Stack = createStackNavigator<HomeStackParamList>()

export function HomeStack() {
  return (
    <ActiveChildProvider>
      <Stack.Navigator
        screenOptions={defaultScreenOptions}
        screenLayout={screenBoundaryLayout('Home')}
      >
        <Stack.Screen name='Home' component={GamesHomeScreen} />
        <Stack.Screen name='AddChild' component={AddChildScreen} />
        <Stack.Screen name='Crafts' component={CraftsScreen} />
        <Stack.Screen name='Maaltafel' component={MaaltafelScreen} />
        <Stack.Screen name='Math' component={MathScreen} />
        <Stack.Screen name='DinoQuiz' component={DinoQuizScreen} />
        <Stack.Screen name='Memory' component={MemoryScreen} />
        <Stack.Screen name='PlanetPuzzle' component={PlanetPuzzleScreen} />
        <Stack.Screen name='Results' component={ResultsScreen} />
      </Stack.Navigator>
    </ActiveChildProvider>
  )
}
