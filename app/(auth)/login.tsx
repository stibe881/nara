import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { Image } from 'expo-image';
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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('errors.emailPasswordRequired'));
            return;
        }

        setIsLoading(true);
        const { error } = await signIn(email, password);
        setIsLoading(false);

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                Alert.alert(t('common.error'), t('errors.invalidCredentials'));
            } else if (error.message.includes('Email not confirmed')) {
                Alert.alert(t('auth.emailNotConfirmed'), t('auth.confirmEmail'), [
                    { text: 'OK', onPress: () => router.push('/(auth)/verify-email') },
                ]);
            } else {
                Alert.alert(t('common.error'), error.message);
            }
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
                    <Image
                        source={require('@/assets/images/icon.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={[styles.title, { color: theme.text }]}>Nara</Text>
                    <Text style={[styles.subtitle, { color: theme.primary }]}>
                        {t('auth.loginSubtitle')}
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
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password"
                    />

                    <Link href="/(auth)/forgot-password" asChild>
                        <Button
                            title={t('auth.forgotPassword')}
                            onPress={() => { }}
                            variant="ghost"
                            style={styles.forgotPass}
                        />
                    </Link>

                    <Button
                        title={t('auth.loginButton')}
                        onPress={handleLogin}
                        isLoading={isLoading}
                        style={styles.loginButton}
                    />
                </Card>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.icon }]}>
                        {t('auth.noAccount')}{' '}
                    </Text>
                    <Link href="/(auth)/register" asChild>
                        <Button
                            title={t('auth.registerNow')}
                            onPress={() => { }}
                            variant="ghost"
                            style={styles.registerButton}
                        />
                    </Link>
                </View>
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
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '800', // Bolder title
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '500',
    },
    card: {
        marginBottom: 32,
        padding: 24,
        borderRadius: 24,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 0,
        marginBottom: 24,
        height: 32,
    },
    loginButton: {
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 15,
    },
    registerButton: {
        paddingVertical: 0,
        paddingHorizontal: 4,
        minWidth: 0,
        height: 32,
    },
});
