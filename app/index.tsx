import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from "./screens/authScreen";
import HomeScreen from "./screens/HomeScreen";
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
        }

        // Add notification response handler
        const subscription = Notifications.addNotificationResponseReceivedListener(
          response => {
            if (response?.notification?.request?.content?.data?.plantId) {
              const plantId = response.notification.request.content.data.plantId;
              // Handle navigation to plant detail
              console.log('Navigate to plant:', plantId);
            }
          }
        );

        const [onboardingValue, authValue] = await Promise.all([
          AsyncStorage.getItem('hasSeenOnboarding'),
          AsyncStorage.getItem('isAuthenticated')
        ]);
        
        setHasSeenOnboarding(!!onboardingValue);
        setIsAuthenticated(!!authValue);

        return () => {
          subscription.remove();
        };
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    }
    initialize();
  }, []);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    setHasSeenOnboarding(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {__DEV__ && hasSeenOnboarding && (
          <View style={styles.devButton}>
            <TouchableOpacity onPress={resetOnboarding}>
              <Text style={styles.devButtonText}>Reset Onboarding</Text>
            </TouchableOpacity>
          </View>
        )}

        <AuthScreen 
          onAuthenticate={async () => {
            await AsyncStorage.setItem('isAuthenticated', 'true');
            setIsAuthenticated(true);
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    justifyContent: 'center',
  },
  devButton: {
    position: 'absolute',
    top: 40,
    right: 10,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
  },
  devButtonText: {
    color: 'white',
    fontSize: 12,
  },
});
