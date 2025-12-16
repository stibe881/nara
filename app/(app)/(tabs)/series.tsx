import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { Series } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';
import { useWizardStore } from '@/stores/wizard';

export default function SeriesListScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();
    const { setStoryMode, reset } = useWizardStore();
    const [series, setSeries] = useState<(Series & { episode_count: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleNewSeries = () => {
        reset();
        setStoryMode('series');
        router.push('/(app)/wizard/');
    };

    useFocusEffect(
        useCallback(() => {
            loadSeries();
        }, [user?.id])
    );

    const loadSeries = async (isRefresh = false) => {
        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            // Load series with episode count
            const { data, error } = await supabase
                .from('series')
                .select('*, series_episodes(count)')
                .eq('user_id', user?.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            const seriesWithCount = (data || []).map((s: any) => ({
                ...s,
                episode_count: s.series_episodes?.[0]?.count || 0,
            }));

            setSeries(seriesWithCount);
        } catch (error) {
            console.error('Error loading series:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const renderSeries = ({ item }: { item: Series & { episode_count: number } }) => {
        const episodeText = item.episode_count === 1
            ? `1 ${t('seriesScreen.episode')}`
            : `${item.episode_count} ${t('seriesScreen.episodes')}`;

        const statusText = item.is_finished
            ? `✅ ${t('seriesScreen.finished')}`
            : `📚 ${item.mode === 'fixed' ? `${item.episode_count}/${item.planned_episodes}` : episodeText}`;

        return (
            <TouchableOpacity
                style={styles.seriesCard}
                onPress={() => router.push(`/(app)/series/${item.id}`)}
            >
                <View style={styles.seriesIcon}>
                    <Text style={styles.seriesEmoji}>
                        {item.category?.slug === 'abenteuer' ? '🗺️' :
                            item.category?.slug === 'fantasie' ? '✨' :
                                item.category?.slug === 'tiere' ? '🐻' : '📚'}
                    </Text>
                </View>
                <View style={styles.seriesContent}>
                    <Text style={styles.seriesTitle} numberOfLines={1}>
                        {item.title || t('seriesScreen.unnamed')}
                    </Text>
                    <Text style={styles.seriesMeta}>
                        {item.category?.name || t('seriesScreen.free')} • {statusText}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B7FA8" />
            </TouchableOpacity>
        );
    };

    const ListEmptyComponent = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>{t('seriesScreen.noSeries')}</Text>
            <Text style={styles.emptyText}>
                {t('seriesScreen.createFirstHint')}
            </Text>
            <TouchableOpacity
                style={styles.createButton}
                onPress={handleNewSeries}
            >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>{t('seriesScreen.newSeries')}</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A78BFA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={series}
                renderItem={renderSeries}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={ListEmptyComponent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadSeries(true)}
                        tintColor="#A78BFA"
                        colors={['#A78BFA']}
                    />
                }
            />

            {/* FAB for new series */}
            {series.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleNewSeries}
                >
                    <Ionicons name="add" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1625',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    seriesCard: {
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    seriesIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#3D3255',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    seriesEmoji: {
        fontSize: 24,
    },
    seriesContent: {
        flex: 1,
    },
    seriesTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    seriesMeta: {
        fontSize: 13,
        color: '#8B7FA8',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#8B7FA8',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
});
