import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle
} from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    isLoading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    isLoading = false,
    disabled = false,
    style,
}: ButtonProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light']; // Prefer light for V2 if system allows or forces
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    const getBackgroundColor = () => {
        if (disabled) return theme.border;
        if (variant === 'primary') return theme.primary; // Strong Violet
        if (variant === 'secondary') return theme.surface; // White/Surface
        return 'transparent';
    };

    const getTextColor = () => {
        if (disabled) return theme.icon;
        if (variant === 'primary') return '#FFFFFF';
        if (variant === 'outline') return theme.primary;
        if (variant === 'ghost') return theme.subtext;
        return theme.text;
    };

    const getBorder = () => {
        if (variant === 'outline') return { borderWidth: 1.5, borderColor: theme.primary };
        if (variant === 'secondary') return { borderWidth: 1, borderColor: theme.border };
        return {};
    };

    const getShadow = () => {
        if (variant === 'primary' && !disabled) {
            return {
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
            };
        }
        return {};
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || isLoading}
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: getBackgroundColor() },
                getBorder(),
                getShadow(),
                style,
                pressed && { opacity: 0.9 },
            ]}>
            <Animated.View style={{ transform: [{ scale }] }}>
                {isLoading ? (
                    <ActivityIndicator color={getTextColor()} />
                ) : (
                    <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
                )}
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 56, // Taller touch target for V2
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 24,
    },
    text: {
        fontSize: 17, // Larger text
        fontWeight: '700', // Bolder
        textAlign: 'center',
        letterSpacing: 0.3,
    },
});
