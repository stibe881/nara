import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function VerifyEmailScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <Text style={styles.emoji}>📧</Text>
                <Text style={[styles.title, { color: theme.text }]}>
                    E-Mail bestaetigen
                </Text>
                <Text style={[styles.description, { color: theme.icon }]}>
                    Wir haben dir eine E-Mail mit einem Bestaetigungslink gesendet. Bitte
                    klicke auf den Link, um dein Konto zu aktivieren.
                </Text>

                <Card style={styles.infoBox}>
                    <Text style={[styles.infoTitle, { color: theme.text }]}>
                        Keine E-Mail erhalten?
                    </Text>
                    <Text style={[styles.infoText, { color: theme.icon }]}>
                        • Pruefe deinen Spam-Ordner{'\n'}
                        • Warte einige Minuten{'\n'}
                        • Stelle sicher, dass die E-Mail-Adresse korrekt ist
                    </Text>
                </Card>

                <Link href="/(auth)/login" asChild>
                    <Button title="Zurück zum Login" onPress={() => { }} style={styles.button} />
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    infoBox: {
        width: '100%',
        marginBottom: 32,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 22,
    },
    button: {
        width: '100%',
    },
});
