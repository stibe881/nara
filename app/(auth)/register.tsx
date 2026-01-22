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
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert(t('common.error'), t('errors.fillAllFields'));
            return;
        }

        if (password.length < 6) {
            Alert.alert(t('common.error'), t('errors.passwordTooShort'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('common.error'), t('errors.passwordsNoMatch'));
            return;
        }

        setIsLoading(true);
        const { error } = await signUp(email, password);
        setIsLoading(false);

        if (error) {
            if (error.message.includes('already registered')) {
                Alert.alert(t('common.error'), t('errors.emailExists'));
            } else {
                Alert.alert(t('common.error'), error.message);
            }
        } else {
            router.replace('/(auth)/verify-email');
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.emoji}>✨</Text>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {t('auth.createAccount')}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.primary }]}>
                        {t('auth.createAccountSubtitle')}
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Input
                        label={t('auth.email')}
                        placeholder="mamapapa@email.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />

                    <Input
                        label={t('auth.password')}
                        placeholder={t('auth.passwordPlaceholder')}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="new-password"
                    />

                    <Input
                        label={t('auth.confirmPassword')}
                        placeholder={t('auth.confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoComplete="new-password"
                    />

                    <Button
                        title={t('auth.registerButton')}
                        onPress={handleRegister}
                        isLoading={isLoading}
                        style={styles.registerButton}
                    />
                </Card>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.icon }]}>
                        {t('auth.hasAccount')}{' '}
                    </Text>
                    <Link href="/(auth)/login" asChild>
                        <Button
                            title={t('auth.loginNow')}
                            onPress={() => { }}
                            variant="ghost"
                            style={styles.loginButton}
                        />
                    </Link>
                </View>

                <Text style={[styles.privacyText, { color: theme.icon }]}>
                    {t('auth.privacyNote')}
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    card: {
        marginBottom: 24,
        padding: 24,
        borderRadius: 24,
    },
    registerButton: {
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 15,
    },
    loginButton: {
        paddingVertical: 0,
        paddingHorizontal: 4,
        minWidth: 0,
        height: 32,
    },
    privacyText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 16,
        opacity: 0.7,
    },
});
