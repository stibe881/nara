import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function VerifyEmailScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.emoji}>📧</Text>
                <Text style={styles.title}>E-Mail bestaetigen</Text>
                <Text style={styles.description}>
                    Wir haben dir eine E-Mail mit einem Bestaetigungslink gesendet.
                    Bitte klicke auf den Link, um dein Konto zu aktivieren.
                </Text>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>Keine E-Mail erhalten?</Text>
                    <Text style={styles.infoText}>
                        • Pruefe deinen Spam-Ordner{'\n'}
                        • Warte einige Minuten{'\n'}
                        • Stelle sicher, dass die E-Mail-Adresse korrekt ist
                    </Text>
                </View>

                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Zurück zum Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 72,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F5F3FF',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#A78BFA',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    infoBox: {
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#B3A7D3',
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
