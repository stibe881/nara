import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
    variant?: 'default' | 'flat' | 'outlined';
    style?: ViewStyle;
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getStyle = () => {
        if (variant === 'flat') {
            return {
                backgroundColor: 'transparent',
            };
        }
        // Default "Canvas" Card
        return {
            backgroundColor: theme.surface,
            borderRadius: 24, // Softer corners
            shadowColor: theme.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, // Very subtle shadow
            shadowRadius: 8,
            elevation: 2,
        };
    };

    return (
        <View
            style={[
                styles.base,
                getStyle(),
                variant === 'outlined' && { borderWidth: 1, borderColor: theme.border, shadowOpacity: 0, elevation: 0 },
                style,
            ]}
            {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        padding: 20,
        marginBottom: 16,
    },
});
