import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useState } from 'react';

export default function WebViewScreen() {
    const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
    const [isLoading, setIsLoading] = useState(true);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: title || 'Laden...' }} />
            <WebView
                source={{ uri: url || '' }}
                style={styles.webview}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
            />
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1A1625',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
