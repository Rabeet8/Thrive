import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Update notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

class NotificationService {
  static isInitialized = false;
  static notificationListener: Notifications.Subscription | null = null;
  static responseListener: Notifications.Subscription | null = null;

  static async init() {
    if (this.isInitialized) return;

    try {
      // Register for push notifications
      await this.registerForPushNotificationsAsync();

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('plant-watering', {
          name: 'Plant Watering',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Set up notification listeners
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('NOTIFICATION RECEIVED:', notification);
      });

      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('NOTIFICATION RESPONSE:', response);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      throw error;
    }
  }

  static async registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      // Get project ID for push notifications
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (projectId) {
        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('Push token:', token);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  static async schedulePlantWateringNotification(
    plantId: string, 
    plantName: string, 
    frequencyDays: number
  ) {
    try {
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + frequencyDays);

      const notification = {
        content: {
          title: "Time to water your plant! 💧",
          body: `${plantName} needs watering`,
          data: { plantId, plantName },
          sound: true,
        },
        trigger: {
          date: triggerDate,
          channelId: Platform.OS === 'android' ? 'plant-watering' : undefined,
        },
      };

      const notificationId = await Notifications.scheduleNotificationAsync(notification);
      console.log('Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  static cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Initialize on import
NotificationService.init().catch(console.error);

export default NotificationService;