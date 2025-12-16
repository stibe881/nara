import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCoinBalance } from '@/lib/purchases';
import { supabase } from '@/lib/supabase';

interface CoinBalanceProps {
    showAlways?: boolean;
}

export default function CoinBalance({ showAlways = false }: CoinBalanceProps) {
    const router = useRouter();
    const [coins, setCoins] = useState<number>(0);
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadBalance();

        // Subscribe to profile changes
        const channel = supabase
            .channel('coin-balance')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                },
                () => {
                    loadBalance();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadBalance = async () => {
        const balance = await getCoinBalance();
        setCoins(balance.coins);
        setIsPremium(balance.isPremium);
        setIsLoading(false);
    };

    // Don't show for premium users (unless showAlways)
    if (isPremium && !showAlways) {
        return (
            <TouchableOpacity
                style={styles.premiumBadge}
                onPress={() => router.push('/(app)/subscription')}
            >
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.premiumText}>Premium</Text>
            </TouchableOpacity>
        );
    }

    if (isLoading) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push('/(app)/subscription')}
        >
            <View style={styles.coinIcon}>
                <Text style={styles.coinEmoji}>🪙</Text>
            </View>
            <Text style={styles.coinCount}>{coins}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D2640',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    coinIcon: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinEmoji: {
        fontSize: 16,
    },
    coinCount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFD700',
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    premiumText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFD700',
    },
});
