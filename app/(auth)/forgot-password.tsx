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
import useI18n from '@/hooks/useI18n';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { resetPassword } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

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
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.emoji}>✅</Text>
                    <Text style={styles.title}>{t('auth.emailSent')}</Text>
                    <Text style={styles.description}>
                        {t('auth.resetEmailSent')}
                    </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>{t('auth.backToLogin')}</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.emoji}>🔑</Text>
                <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
                <Text style={styles.description}>
                    {t('auth.forgotPasswordDesc')}
                </Text>

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

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.sendResetLink')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity style={styles.backButton}>
                        <Text style={styles.backText}>← {t('auth.backToLogin')}</Text>
                    </TouchableOpacity>
                </Link>
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
        alignItems: 'center',
    },
    emoji: {
        fontSize: 56,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F5F3FF',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#A78BFA',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 24,
    },
    form: {
        width: '100%',
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
    button: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    backButton: {
        marginTop: 24,
    },
    backText: {
        color: '#A78BFA',
        fontSize: 15,
    },
});
