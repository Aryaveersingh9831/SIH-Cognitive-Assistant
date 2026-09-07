// App.tsx
import './src/i18n/i18n';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LanguageSelectScreen from './src/screens/LanguageSelectScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MoodCheckInScreen from './src/screens/MoodCheckInScreen';
import HomeScreen from './src/screens/HomeScreen';
import GameSelectionScreen, { GameType } from './src/screens/GameSelectionScreen';
import CaregiverDashboardScreen from './src/screens/CaregiverDashboardScreen';
import CaregiverPatientDetailScreen from './src/screens/CaregiverPatientDetailScreen';
import AlarmScreen from './src/screens/AlarmScreen';
import { setupAlarmChannel } from './src/notifications/alarmChannel';

export type RootStackParamList = {
  Language: undefined;
  Login: undefined;
  Register: undefined;
  Mood: undefined;
  Home: undefined;
  GameSelection: undefined;
  CaregiverDashboard: undefined;
  CaregiverPatientDetail: { patientId: string; patientName?: string };
  AlarmScreen: { title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    setupAlarmChannel();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Language">
          {({ navigation }) => (
            <LanguageSelectScreen
              onContinue={(languageCode) => {
                console.log('Selected language:', languageCode);
                navigation.navigate('Login');
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onLoginSuccess={(role) =>
                navigation.navigate(role === 'caregiver' ? 'CaregiverDashboard' : 'Mood')
              }
              onGoToRegister={() => navigation.navigate('Register')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Register">
          {({ navigation }) => (
            <RegisterScreen
              onRegisterSuccess={(role) =>
                navigation.navigate(role === 'caregiver' ? 'CaregiverDashboard' : 'Mood')
              }
              onGoToLogin={() => navigation.navigate('Login')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Mood">
          {({ navigation }) => (
            <MoodCheckInScreen
              onSelect={(mood) => {
                console.log('Selected mood:', mood);
                navigation.navigate('Home');
              }}
              onSkip={() => {
                navigation.navigate('Home');
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              onPlayGame={() => navigation.navigate('GameSelection')}
              onReminders={() => {
                // TODO: navigate to Reminders screen once it exists (separate issue)
              }}
              onProgress={() => {
                // TODO: navigate to Progress screen once it exists
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="GameSelection">
          {({ navigation }) => (
            <GameSelectionScreen
              onBack={() => navigation.goBack()}
              onSelectGame={(gameType: GameType) => {
                console.log('Selected game:', gameType);
                // TODO: navigate to the specific game screen shell once it exists
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="CaregiverDashboard">
          {({ navigation }) => (
            <CaregiverDashboardScreen
              onSelectPatient={(patientId) => {
                navigation.navigate('CaregiverPatientDetail', { patientId });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="CaregiverPatientDetail">
          {({ navigation, route }) => (
            <CaregiverPatientDetailScreen
              patientId={route.params.patientId}
              patientName={route.params.patientName}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="AlarmScreen"
          component={AlarmScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}