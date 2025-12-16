import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import useI18n from '@/hooks/useI18n';

export default function TabsLayout() {
    const { t } = useI18n();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#A78BFA',
                tabBarInactiveTintColor: '#6B5B8A',
                tabBarStyle: {
                    backgroundColor: '#1A1625',
                    borderTopColor: '#2D2640',
                    borderTopWidth: 1,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    height: Platform.OS === 'ios' ? 88 : 68,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#1A1625',
                },
                headerTintColor: '#F5F3FF',
                headerTitleStyle: {
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: t('tabs.home'),
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="moon" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: t('tabs.stories'),
                    headerTitle: t('stories.title'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="series"
                options={{
                    title: t('tabs.series'),
                    headerTitle: t('series.title'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="library" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('tabs.settings'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
