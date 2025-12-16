import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import useI18n from '@/hooks/useI18n';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

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
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>✨</Text>
                        <Text style={styles.title}>{t('auth.createAccount')}</Text>
                        <Text style={styles.subtitle}>
                            {t('auth.createAccountSubtitle')}
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.email')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="deine@email.de"
                                placeholderTextColor="#8B7FA8"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('auth.passwordPlaceholder')}
                                placeholderTextColor="#8B7FA8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="new-password"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('auth.confirmPasswordPlaceholder')}
                                placeholderTextColor="#8B7FA8"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoComplete="new-password"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.registerButtonText}>{t('auth.registerButton')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>{t('auth.hasAccount')} </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>{t('auth.loginNow')}</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Privacy Note */}
                    <Text style={styles.privacyText}>
                        {t('auth.privacyNote')}
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 48,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 56,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F5F3FF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#A78BFA',
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E9E3F5',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    registerButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginText: {
        color: '#8B7FA8',
        fontSize: 15,
    },
    loginLink: {
        color: '#A78BFA',
        fontSize: 15,
        fontWeight: '600',
    },
    privacyText: {
        color: '#6B5B8A',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 24,
        lineHeight: 18,
    },
});
