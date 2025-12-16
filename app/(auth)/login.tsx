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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { LinearGradient } from 'expo-linear-gradient';
import useI18n from '@/hooks/useI18n';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

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
                Alert.alert(
                    t('auth.emailNotConfirmed'),
                    t('auth.confirmEmail'),
                    [
                        { text: 'OK', onPress: () => router.push('/(auth)/verify-email') }
                    ]
                );
            } else {
                Alert.alert(t('common.error'), error.message);
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Logo/Header Section */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🌙</Text>
                    <Text style={styles.title}>Traumfunke</Text>
                    <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
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
                            placeholder="••••••••"
                            placeholderTextColor="#8B7FA8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                        />
                    </View>

                    <Link href="/(auth)/forgot-password" asChild>
                        <TouchableOpacity style={styles.forgotButton}>
                            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
                        </TouchableOpacity>
                    </Link>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>{t('auth.loginButton')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Register Link */}
                <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>{t('auth.noAccount')} </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.registerLink}>{t('auth.registerNow')}</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#F5F3FF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
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
    forgotButton: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        color: '#A78BFA',
        fontSize: 14,
    },
    loginButton: {
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
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    registerText: {
        color: '#8B7FA8',
        fontSize: 15,
    },
    registerLink: {
        color: '#A78BFA',
        fontSize: 15,
        fontWeight: '600',
    },
});
