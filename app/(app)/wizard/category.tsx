import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/stores/wizard';
import type { StoryCategory } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';

export default function WizardCategoryScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const { selectedCategoryId, setCategory } = useWizardStore();
    const [categories, setCategories] = useState<StoryCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('story_categories')
                .select('*')
                .order('sort_order');

            if (data) setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
        setIsLoading(false);
    };

    const handleNext = () => {
        if (!selectedCategoryId) return;
        router.push('/(app)/wizard/characters');
    };

    const renderCategory = ({ item }: { item: StoryCategory }) => {
        const isSelected = selectedCategoryId === item.id;

        return (
            <TouchableOpacity
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                onPress={() => setCategory(item.id)}
            >
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    {item.description && (
                        <Text style={styles.categoryDesc}>{item.description}</Text>
                    )}
                </View>
                {isSelected && (
                    <View style={styles.checkmark}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

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
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
            </View>

            <Text style={styles.instruction}>
                Wähle eine Kategorie für die Geschichte:
            </Text>

            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                numColumns={2}
                columnWrapperStyle={styles.row}
            />

            {/* Next Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        !selectedCategoryId && styles.nextButtonDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={!selectedCategoryId}
                >
                    <Text style={styles.nextButtonText}>Weiter</Text>
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
    instruction: {
        fontSize: 15,
        color: '#A78BFA',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    list: {
        padding: 12,
    },
    row: {
        gap: 10,
        marginBottom: 10,
    },
    categoryCard: {
        flex: 1,
        backgroundColor: '#2D2640',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4C4270',
        minHeight: 120,
    },
    categoryCardSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    categoryInfo: {
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F5F3FF',
        textAlign: 'center',
    },
    categoryDesc: {
        fontSize: 11,
        color: '#8B7FA8',
        textAlign: 'center',
        marginTop: 4,
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#2D2640',
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
    nextButtonDisabled: {
        backgroundColor: '#3D3255',
        shadowOpacity: 0,
        elevation: 0,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
