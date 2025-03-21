import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async schedulePlantWateringNotification(plantId: string, plantName: string, frequencyDays: number) {
    if (!plantId || !plantName || !frequencyDays) {
      console.error('Invalid parameters for scheduling notification');
      return null;
    }

    try {
      // Cancel any existing notifications for this plant
      await this.cancelPlantNotifications(plantId);

      // Calculate next watering date preserving the current time
      const now = new Date();
      const nextWateringDate = new Date();
      nextWateringDate.setDate(now.getDate() + frequencyDays);
      nextWateringDate.setHours(now.getHours());
      nextWateringDate.setMinutes(now.getMinutes());
      nextWateringDate.setSeconds(now.getSeconds());
      console.log('Current time:', now);
      console.log('Scheduled time:', nextWateringDate);
      console.log('Difference in milliseconds:', nextWateringDate.getTime() - now.getTime());
      // Schedule notification for exact date
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to water your plant! 💧",
          body: `${plantName} needs watering`,
          data: { plantId },
        },
        
        trigger: {
          date: nextWateringDate,
          repeats: false // Set to false to ensure one-time notification
        },
      });
      console.log('Notification trigger:', {
        date: nextWateringDate.toISOString(),
        repeats: false
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }


  
  static async scheduleImmediateNotification(plantName: string) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Plant Added Successfully! 🌱",
          body: `${plantName} has been added to your garden`,
        },
        trigger: null, // Immediate notification
      });
      return notificationId;
    } catch (error) {
      console.error('Error scheduling immediate notification:', error);
      return null;
    }
  }

  static async cancelPlantNotifications(plantId: string) {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.plantId === plantId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }
}

export default NotificationService;
