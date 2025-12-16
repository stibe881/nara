import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Register for push notifications and save token to user profile
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    // Only works on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
    }

    try {
        // Check/request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission not granted');
            return null;
        }

        // Get Expo push token - use projectId from Constants or fallback
        const projectId = Constants.expoConfig?.extra?.eas?.projectId
            || Constants.easConfig?.projectId
            || 'd906c22e-3faf-4578-9ae9-1a7c0dbb8ae4'; // Hardcoded fallback

        console.log('Using projectId for push notifications:', projectId);

        const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        const pushToken = tokenData;
        console.log('Push token:', pushToken);

        // Save token to user profile
        const { error } = await supabase
            .from('profiles')
            .update({ push_token: pushToken })
            .eq('id', userId);

        if (error) {
            console.error('Error saving push token:', error);
        }

        // Android-specific channel setup
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Traumfunke',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#7C3AED',
            });
        }

        return pushToken;
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
}

/**
 * Handle notification received while app is foregrounded
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification response (user tapped on notification)
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(title: string, body: string, seconds: number = 5) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: 'default',
        },
        trigger: seconds > 0 ? { seconds } as any : null,
    });
}
