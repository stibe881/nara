import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { Series, Moral, StoryLength } from '@/types/supabase';

const LENGTH_OPTIONS = [
    { value: 'kurz', label: 'Kurz', description: '~5 Min' },
    { value: 'normal', label: 'Normal', description: '~8 Min' },
    { value: 'lang', label: 'Lang', description: '~12 Min' },
];

export default function NewEpisodeScreen() {
    const router = useRouter();
    const { id: seriesId } = useLocalSearchParams<{ id: string }>();
    const { session } = useAuth();
    const [series, setSeries] = useState<Series | null>(null);
    const [morals, setMorals] = useState<Moral[]>([]);
    const [selectedMoralKey, setSelectedMoralKey] = useState<string>('none');
    const [length, setLength] = useState<StoryLength>('normal');
    const [makeFinal, setMakeFinal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [episodeCount, setEpisodeCount] = useState(0);

    useEffect(() => {
        loadData();
    }, [seriesId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load series
            const { data: seriesData } = await supabase
                .from('series')
                .select('*')
                .eq('id', seriesId)
                .single();
            setSeries(seriesData);
            setLength(seriesData?.default_length || 'normal');

            // Load morals
            const { data: moralsData } = await supabase
                .from('morals')
                .select('*')
                .order('sort_order');
            setMorals([{ id: 'none', slug: 'none', text: 'Keine spezifische Moral', sort_order: 0 }, ...(moralsData || [])]);

            // Count existing episodes
            const { count } = await supabase
                .from('series_episodes')
                .select('*', { count: 'exact', head: true })
                .eq('series_id', seriesId);
            setEpisodeCount(count || 0);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedMoralKey) return;

        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-series-episode', {
                body: {
                    series_id: seriesId,
                    moral_key: selectedMoralKey,
                    length_setting: length,
                    make_final: makeFinal,
                    notify_on_complete: true,
                },
            });

            if (error) throw error;

            // Navigate to story view
            if (data.story_id) {
                router.replace(`/(app)/story/${data.story_id}`);
            } else {
                router.back();
            }
        } catch (error) {
            console.error('Error generating episode:', error);
            setIsGenerating(false);
        }
    };

    const nextEpisodeNumber = episodeCount + 1;
    const isLastFixedEpisode = series?.mode === 'fixed' && nextEpisodeNumber === series.planned_episodes;
    const showFinalToggle = series?.mode === 'unlimited' && !isLastFixedEpisode;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A78BFA" />
            </View>
        );
    }

    if (isGenerating) {
        return (
            <View style={styles.generatingContainer}>
                <ActivityIndicator size="large" color="#A78BFA" />
                <Text style={styles.generatingTitle}>Folge {nextEpisodeNumber} wird erstellt...</Text>
                <Text style={styles.generatingSubtitle}>
                    Die KI schreibt dein Abenteuer weiter ✨
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Episode Header */}
                <View style={styles.header}>
                    <View style={styles.episodeBadge}>
                        <Text style={styles.episodeBadgeText}>Folge {nextEpisodeNumber}</Text>
                    </View>
                    <Text style={styles.title}>{series?.title || 'Serie'}</Text>
                    {isLastFixedEpisode && (
                        <View style={styles.finalBadge}>
                            <Ionicons name="flag" size={14} color="#FFFFFF" />
                            <Text style={styles.finalBadgeText}>Finale Folge</Text>
                        </View>
                    )}
                </View>

                {/* Moral Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Moral für diese Folge</Text>
                    <Text style={styles.sectionHint}>Welche Botschaft soll diese Folge haben?</Text>
                    <View style={styles.moralList}>
                        {morals.map((moral) => {
                            const isSelected = selectedMoralKey === moral.slug;
                            return (
                                <TouchableOpacity
                                    key={moral.id}
                                    style={[styles.moralCard, isSelected && styles.moralCardSelected]}
                                    onPress={() => setSelectedMoralKey(moral.slug)}
                                >
                                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[styles.moralText, isSelected && styles.moralTextSelected]}>
                                        {moral.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Length Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Länge</Text>
                    <View style={styles.lengthOptions}>
                        {LENGTH_OPTIONS.map((option) => {
                            const isSelected = length === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.lengthOption, isSelected && styles.lengthOptionSelected]}
                                    onPress={() => setLength(option.value as StoryLength)}
                                >
                                    <Text style={[styles.lengthLabel, isSelected && styles.lengthLabelSelected]}>
                                        {option.label}
                                    </Text>
                                    <Text style={styles.lengthDescription}>{option.description}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Final Toggle (for unlimited series) */}
                {showFinalToggle && (
                    <View style={styles.section}>
                        <View style={styles.finalToggle}>
                            <View style={styles.finalToggleContent}>
                                <Text style={styles.finalToggleTitle}>Abschließende Folge?</Text>
                                <Text style={styles.finalToggleHint}>
                                    Wenn ja, endet die Serie mit einem schönen Abschluss
                                </Text>
                            </View>
                            <Switch
                                value={makeFinal}
                                onValueChange={setMakeFinal}
                                trackColor={{ false: '#3D3255', true: '#7C3AED' }}
                                thumbColor={makeFinal ? '#A78BFA' : '#6B5B8A'}
                            />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Generate Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.generateButton, !selectedMoralKey && styles.generateButtonDisabled]}
                    onPress={handleGenerate}
                    disabled={!selectedMoralKey}
                >
                    <Ionicons name="sparkles" size={22} color="#FFFFFF" />
                    <Text style={styles.generateButtonText}>
                        {makeFinal || isLastFixedEpisode ? 'Finale erstellen' : 'Folge erstellen'}
                    </Text>
                </TouchableOpacity>
            </View>
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
    generatingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1625',
        padding: 40,
    },
    generatingTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#F5F3FF',
        marginTop: 24,
        textAlign: 'center',
    },
    generatingSubtitle: {
        fontSize: 14,
        color: '#8B7FA8',
        marginTop: 8,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    episodeBadge: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    episodeBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#F5F3FF',
    },
    finalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#22C55E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 12,
        gap: 6,
    },
    finalBadgeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#A78BFA',
        marginBottom: 6,
    },
    sectionHint: {
        fontSize: 13,
        color: '#8B7FA8',
        marginBottom: 12,
    },
    moralList: {
        gap: 10,
    },
    moralCard: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    moralCardSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#6B5B8A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioSelected: {
        borderColor: '#7C3AED',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#7C3AED',
    },
    moralText: {
        flex: 1,
        fontSize: 14,
        color: '#E9E3F5',
    },
    moralTextSelected: {
        color: '#F5F3FF',
        fontWeight: '500',
    },
    lengthOptions: {
        flexDirection: 'row',
        gap: 10,
    },
    lengthOption: {
        flex: 1,
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    lengthOptionSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    lengthLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#E9E3F5',
        marginBottom: 4,
    },
    lengthLabelSelected: {
        color: '#A78BFA',
    },
    lengthDescription: {
        fontSize: 12,
        color: '#8B7FA8',
    },
    finalToggle: {
        backgroundColor: '#2D2640',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    finalToggleContent: {
        flex: 1,
    },
    finalToggleTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    finalToggleHint: {
        fontSize: 12,
        color: '#8B7FA8',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#1A1625',
        borderTopWidth: 1,
        borderTopColor: '#2D2640',
    },
    generateButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    generateButtonDisabled: {
        opacity: 0.5,
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
