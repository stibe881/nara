import useI18n from '@/hooks/useI18n';
import {
    addCoins,
    checkPremiumStatus,
    getCoinBalance,
    getOfferings,
    PRODUCT_IDS,
    purchasePackage,
    restorePurchases,
} from '@/lib/purchases';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [coinBalance, setCoinBalance] = useState(0);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [offerings, setOfferings] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [premium, balance, offers] = await Promise.all([
            checkPremiumStatus(),
            getCoinBalance(),
            getOfferings(),
        ]);
        setIsPremium(premium);
        setIsPremium(premium);
        setCoinBalance(balance.coins);
        setExpiresAt(balance.expiresAt);
        setOfferings(offers);
        setIsLoading(false);
    };

    const handlePurchase = async (pkg: any) => {
        setIsPurchasing(true);
        const result = await purchasePackage(pkg);
        setIsPurchasing(false);

        if (result) {
            // Check if it was a coin purchase
            if (pkg.product.identifier === PRODUCT_IDS.COINS_5) {
                await addCoins(5, '5 Münzen gekauft');
            } else if (pkg.product.identifier === PRODUCT_IDS.COINS_1) {
                await addCoins(1, '1 Münze gekauft');
            }
            await loadData();
            Alert.alert(t('common.success'), t('subscription.purchaseSuccess'));
        }
    };

    const handleRestore = async () => {
        setIsPurchasing(true);
        const result = await restorePurchases();
        setIsPurchasing(false);

        if (result) {
            await loadData();
            Alert.alert(t('common.success'), t('subscription.restoreSuccess'));
        } else {
            Alert.alert('Info', t('subscription.noRestores'));
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ title: t('subscription.title') }} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Coin Shop', // Renamed from Abo
                    headerStyle: { backgroundColor: '#1A1625' },
                    headerTintColor: '#F5F3FF',
                }}
            />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Current Status */}
                <View style={styles.statusCard}>
                    <View style={styles.coinDisplay}>
                        <Text style={styles.coinEmoji}>🪙</Text>
                        <Text style={styles.coinAmount}>{coinBalance}</Text>
                        <Text style={styles.coinLabel}>{t('subscription.coins')}</Text>
                    </View>
                    <Text style={styles.statusText}>
                        {t('subscription.coinExchange')}
                    </Text>
                </View>

                {/* Coins Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('subscription.buyCoins')}</Text>
                    <Text style={styles.sectionSubtitle}>
                        {t('subscription.payAsYouGo')}
                    </Text>

                    <TouchableOpacity
                        style={styles.packageCard}
                        onPress={() => {
                            const pkg = offerings?.availablePackages?.find(
                                (p: any) => p.product.identifier === PRODUCT_IDS.COINS_5
                            );
                            if (pkg) {
                                handlePurchase(pkg);
                            } else {
                                Alert.alert(
                                    t('common.error'),
                                    t('subscription.productUnavailable')
                                );
                            }
                        }}
                        disabled={isPurchasing}
                    >
                        <View style={styles.coinPackage}>
                            <Text style={styles.coinPackageEmoji}>🪙🪙🪙🪙🪙</Text>
                            <View>
                                <Text style={styles.packageTitle}>{t('subscription.fiveCoins')}</Text>
                                <Text style={styles.packagePrice}>
                                    {offerings?.availablePackages?.find(
                                        (p: any) => p.product.identifier === PRODUCT_IDS.COINS_5
                                    )?.product.priceString || t('subscription.fiveCoinsPrice')}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.packageCard}
                        onPress={() => {
                            const pkg = offerings?.availablePackages?.find(
                                (p: any) => p.product.identifier === PRODUCT_IDS.COINS_1
                            );
                            if (pkg) {
                                handlePurchase(pkg);
                            } else {
                                Alert.alert(
                                    t('common.error'),
                                    t('subscription.productUnavailable')
                                );
                            }
                        }}
                        disabled={isPurchasing}
                    >
                        <View style={styles.coinPackage}>
                            <Text style={styles.coinPackageEmoji}>🪙</Text>
                            <View>
                                <Text style={styles.packageTitle}>1 {t('subscription.coins').slice(0, -1)}</Text>
                                <Text style={styles.packagePrice}>
                                    {offerings?.availablePackages?.find(
                                        (p: any) => p.product.identifier === PRODUCT_IDS.COINS_1
                                    )?.product.priceString || '...'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Restore Purchases */}
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestore}
                    disabled={isPurchasing}
                >
                    <Text style={styles.restoreText}>{t('subscription.restorePurchases')}</Text>
                </TouchableOpacity>

                {isPurchasing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#7C3AED" />
                        <Text style={styles.loadingText}>{t('subscription.processing')}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 100, // Adjusted padding
        paddingBottom: 40,
    },
    statusCard: {
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    coinDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    coinEmoji: {
        fontSize: 32,
    },
    coinAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    coinLabel: {
        fontSize: 18,
        color: '#8B7FA8',
    },
    statusText: {
        fontSize: 14,
        color: '#8B7FA8',
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#8B7FA8',
        marginBottom: 16,
    },
    packageCard: {
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F5F3FF',
    },
    packagePrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#A78BFA',
        marginTop: 4,
    },
    coinPackage: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    coinPackageEmoji: {
        fontSize: 20,
    },
    restoreButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    restoreText: {
        fontSize: 14,
        color: '#8B7FA8',
        textDecorationLine: 'underline',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(26, 22, 37, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#F5F3FF',
    },
});
