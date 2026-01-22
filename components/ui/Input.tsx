import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            )}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: theme.surface, // White background
                        color: theme.text,
                        borderColor: error
                            ? theme.error
                            : isFocused
                                ? theme.primary
                                : theme.border, // Subtle border
                        shadowColor: theme.cardShadow,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isFocused ? 0.05 : 0,
                        shadowRadius: 4,
                    },
                    style,
                ]}
                placeholderTextColor={theme.icon} // Lighter placeholder
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
            {error && (
                <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20, // More whitespace
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        opacity: 0.9,
    },
    input: {
        height: 56, // Taller input
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1.5,
        fontSize: 16,
    },
    error: {
        fontSize: 13,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },
});
