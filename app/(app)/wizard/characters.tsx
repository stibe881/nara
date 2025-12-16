import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/stores/wizard';
import { useAuth } from '@/context/auth';
import type { CategoryCharacter, SideCharacter } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';

export default function WizardCharactersScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();
    const {
        selectedCategoryId,
        selectedChildIds,
        selectedCategoryCharacterIds,
        selectedSideCharacterIds,
        toggleCategoryCharacter,
        toggleSideCharacter,
    } = useWizardStore();

    const [categoryCharacters, setCategoryCharacters] = useState<CategoryCharacter[]>([]);
    const [sideCharacters, setSideCharacters] = useState<SideCharacter[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCharacters();
    }, [selectedCategoryId]);

    const loadCharacters = async () => {
        setIsLoading(true);
        try {
            // Load category characters
            if (selectedCategoryId) {
                const { data: catChars } = await supabase
                    .from('category_characters')
                    .select('*')
                    .eq('category_id', selectedCategoryId)
                    .order('sort_order');

                if (catChars) setCategoryCharacters(catChars);
            }

            // Load side characters for selected children
            if (selectedChildIds.length > 0) {
                const { data: sideChars } = await supabase
                    .from('side_characters')
                    .select('*')
                    .in('child_id', selectedChildIds);

                if (sideChars) setSideCharacters(sideChars);
            }
        } catch (error) {
            console.error('Error loading characters:', error);
        }
        setIsLoading(false);
    };

    const handleNext = () => {
        router.push('/(app)/wizard/location');
    };

    const totalSelected = selectedCategoryCharacterIds.length + selectedSideCharacterIds.length;

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#A78BFA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Progress Indicator */}
            <View style={styles.progress}>
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.instruction}>
                    Wähle optionale Charaktere für die Geschichte:
                </Text>

                {/* Category Characters */}
                {categoryCharacters.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Kategorie-Charaktere</Text>
                        <View style={styles.chipsContainer}>
                            {categoryCharacters.map((char) => {
                                const isSelected = selectedCategoryCharacterIds.includes(char.id);
                                return (
                                    <TouchableOpacity
                                        key={char.id}
                                        style={[styles.characterCard, isSelected && styles.characterCardSelected]}
                                        onPress={() => toggleCategoryCharacter(char.id)}
                                    >
                                        <Text style={styles.characterEmoji}>{char.emoji || '🎭'}</Text>
                                        <Text style={[styles.characterName, isSelected && styles.characterNameSelected]}>
                                            {char.name}
                                        </Text>
                                        {isSelected && (
                                            <View style={styles.checkBadge}>
                                                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Side Characters */}
                {sideCharacters.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nebencharaktere</Text>
                        <Text style={styles.sectionHint}>
                            Familienmitglieder und Freunde der ausgewählten Kinder
                        </Text>
                        <View style={styles.chipsContainer}>
                            {sideCharacters.map((char) => {
                                const isSelected = selectedSideCharacterIds.includes(char.id);
                                return (
                                    <TouchableOpacity
                                        key={char.id}
                                        style={[styles.chip, isSelected && styles.chipSelected]}
                                        onPress={() => toggleSideCharacter(char.id)}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                            {char.name}
                                        </Text>
                                        <Text style={[styles.chipType, isSelected && styles.chipTypeSelected]}>
                                            {char.char_type}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {categoryCharacters.length === 0 && sideCharacters.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🎭</Text>
                        <Text style={styles.emptyText}>
                            Keine zusätzlichen Charaktere verfügbar
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {totalSelected > 0 && (
                    <Text style={styles.selectedCount}>
                        {totalSelected} Charakter{totalSelected !== 1 ? 'e' : ''} ausgewählt
                    </Text>
                )}
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {totalSelected > 0 ? 'Weiter' : 'Überspringen'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    progress: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3D3255',
    },
    progressDotActive: {
        backgroundColor: '#7C3AED',
    },
    progressDotDone: {
        backgroundColor: '#22C55E',
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#3D3255',
        marginHorizontal: 4,
    },
    progressLineDone: {
        backgroundColor: '#22C55E',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 24,
    },
    instruction: {
        fontSize: 15,
        color: '#A78BFA',
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 6,
    },
    sectionHint: {
        fontSize: 12,
        color: '#6B5B8A',
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D2640',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#4C4270',
        gap: 6,
    },
    chipSelected: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    chipText: {
        fontSize: 14,
        color: '#E9E3F5',
    },
    chipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    chipType: {
        fontSize: 11,
        color: '#8B7FA8',
    },
    chipTypeSelected: {
        color: '#E9D5FF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#8B7FA8',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#2D2640',
    },
    selectedCount: {
        fontSize: 13,
        color: '#A78BFA',
        textAlign: 'center',
        marginBottom: 12,
    },
    nextButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    // Charakter-Card Styles mit Emoji
    characterCard: {
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        width: '48%',
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    characterCardSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
    },
    characterEmoji: {
        fontSize: 36,
        marginBottom: 8,
    },
    characterName: {
        fontSize: 12,
        color: '#E9E3F5',
        textAlign: 'center',
    },
    characterNameSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
