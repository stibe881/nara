import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { resetPassword } = useAuth();
    const router = useRouter();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert(t('common.error'), t('errors.enterEmail'));
            return;
        }

        setIsLoading(true);
        const { error } = await resetPassword(email);
        setIsLoading(false);

        if (error) {
            Alert.alert(t('common.error'), error.message);
        } else {
            setIsSent(true);
        }
    };

    if (isSent) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.content}>
                    <Card style={styles.card}>
                        <Text style={styles.emoji}>✅</Text>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {t('auth.emailSent')}
                        </Text>
                        <Text style={[styles.description, { color: theme.icon }]}>
                            {t('auth.resetEmailSent')}
                        </Text>
                        <Link href="/(auth)/login" asChild>
                            <Button title={t('auth.backToLogin')} onPress={() => { }} />
                        </Link>
                    </Card>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>🔑</Text>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {t('auth.forgotPassword')}
                    </Text>
                    <Text style={[styles.description, { color: theme.icon }]}>
                        {t('auth.forgotPasswordDesc')}
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Input
                        label={t('auth.email')}
                        placeholder="deine@email.de"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />

                    <Button
                        title={t('auth.sendResetLink')}
                        onPress={handleResetPassword}
                        isLoading={isLoading}
                        style={styles.button}
                    />
                </Card>

                <Link href="/(auth)/login" asChild>
                    <Button
                        title={`← ${t('auth.backToLogin')}`}
                        onPress={() => { }}
                        variant="ghost"
                        style={styles.backButton}
                    />
                </Link>
            </View>
        </KeyboardAvoidingView>
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
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
        textAlign: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    card: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
    },
    button: {
        marginTop: 8,
    },
    backButton: {
        marginTop: 8,
    },
});
