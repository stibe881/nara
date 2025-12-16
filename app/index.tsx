import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#7C3AED" />
            </View>
        );
    }

    if (session) {
        return <Redirect href="/(app)/(tabs)/home" />;
    }

    return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1625',
    },
});
