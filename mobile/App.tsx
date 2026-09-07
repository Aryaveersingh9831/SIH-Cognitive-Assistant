// App.tsx
import './src/i18n/i18n';
import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LanguageSelectScreen from './src/screens/LanguageSelectScreen';

import LoginScreen from './src/screens/LoginScreen';

import RegisterScreen from './src/screens/RegisterScreen';

import MoodCheckInScreen from './src/screens/MoodCheckInScreen';

import HomeScreen from './src/screens/HomeScreen';

import GameSelectionScreen, {
  GameType,
} from './src/screens/GameSelectionScreen';

import CaregiverDashboardScreen from './src/screens/CaregiverDashboardScreen';
import CaregiverPatientDetailScreen from './src/screens/CaregiverPatientDetailScreen';
import AlarmScreen from './src/screens/AlarmScreen';

import MemoryScreen from './src/screens/MemoryScreen';

import { setupAlarmChannel } from './src/notifications/alarmChannel';

export type RootStackParamList = {
  Language: undefined;
  Login: undefined;
  Register: undefined;
  Mood: undefined;
  Home: undefined;
  GameSelection: undefined;
  Memory: undefined;
  CaregiverDashboard: undefined;
  CaregiverPatientDetail: { patientId: string; patientName?: string };
  AlarmScreen: { title: string };
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(
    null
  );

  useEffect(() => {
    setupAlarmChannel();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
      >
        {/* LANGUAGE */}
        <Stack.Screen name="Language">
          {({ navigation }) => (
            <LanguageSelectScreen
              onContinue={(languageCode) => {
                console.log(
                  'Selected language:',
                  languageCode
                );

                navigation.navigate('Login');
              }}
            />
          )}
        </Stack.Screen>

        {/* LOGIN */}
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onLoginSuccess={(role, token) => {
                setAuthToken(token);
                navigation.navigate(
                  role === 'caregiver'
                    ? 'CaregiverDashboard'
                    : 'Mood'
                );
              }}
              onGoToRegister={() =>
                navigation.navigate('Register')
              }
            />
          )}
        </Stack.Screen>

        {/* REGISTER */}
        <Stack.Screen name="Register">
          {({ navigation }) => (
            <RegisterScreen
              onRegisterSuccess={(role, token) => {
                setAuthToken(token);
                navigation.navigate(
                  role === 'caregiver'
                    ? 'CaregiverDashboard'
                    : 'Mood'
                );
              }}
              onGoToLogin={() =>
                navigation.navigate('Login')
              }
            />
          )}
        </Stack.Screen>

        {/* MOOD */}
        <Stack.Screen name="Mood">
          {({ navigation }) => (
            <MoodCheckInScreen
              onSelect={(mood) => {
                console.log(
                  'Selected mood:',
                  mood
                );

                navigation.navigate('Home');
              }}
              onSkip={() => {
                navigation.navigate('Home');
              }}
            />
          )}
        </Stack.Screen>

        {/* HOME */}
        <Stack.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              onPlayGame={() =>
                navigation.navigate('GameSelection')
              }
              onReminders={() => {
                // TODO: navigate to Reminders screen once it exists
              }}
              onProgress={() => {
                // TODO: navigate to Progress screen once it exists
              }}
            />
          )}
        </Stack.Screen>

        {/* GAME SELECTION */}
        <Stack.Screen name="GameSelection">
          {({ navigation }) => (
            <GameSelectionScreen
              onBack={() => navigation.goBack()}
              onSelectGame={(gameType: GameType) => {
                if (gameType === 'MEMORY') {
                  navigation.navigate('Memory');
                }
              }}
            />
          )}
        </Stack.Screen>

        {/* MEMORY GAME */}
        <Stack.Screen name="Memory">
          {({ navigation }) => (
            <MemoryScreen
              onBack={() => navigation.goBack()}
              authToken={authToken}
            />
          )}
        </Stack.Screen>

        {/* CAREGIVER DASHBOARD */}
        <Stack.Screen name="CaregiverDashboard">
          {({ navigation }) => (
            <CaregiverDashboardScreen
              onSelectPatient={(patientId, patientName) => {
                navigation.navigate('CaregiverPatientDetail', { patientId, patientName });
              }}
            />
          )}
        </Stack.Screen>

        {/* CAREGIVER PATIENT DETAIL */}
        <Stack.Screen name="CaregiverPatientDetail">
          {({ navigation, route }) => (
            <CaregiverPatientDetailScreen
              patientId={route.params.patientId}
              patientName={route.params.patientName}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        {/* ALARM */}
        <Stack.Screen
          name="AlarmScreen"
          component={AlarmScreen}
          options={{
            presentation: 'fullScreenModal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
