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
import type { Moral } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';

export default function WizardMoralScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const { selectedMoralId, setMoral } = useWizardStore();
    const [morals, setMorals] = useState<Moral[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMorals();
    }, []);

    const loadMorals = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('morals')
                .select('*')
                .order('sort_order');

            if (data) setMorals(data);
        } catch (error) {
            console.error('Error loading morals:', error);
        }
        setIsLoading(false);
    };

    const handleNext = () => {
        router.push('/(app)/wizard/length');
    };

    const renderMoral = ({ item }: { item: Moral }) => {
        const isSelected = selectedMoralId === item.id;
        const isNoMoral = item.slug === 'keine';

        return (
            <TouchableOpacity
                style={[
                    styles.moralCard,
                    isSelected && styles.moralCardSelected,
                    isNoMoral && styles.moralCardNoMoral,
                ]}
                onPress={() => setMoral(item.id)}
            >
                <Text style={[styles.moralText, isNoMoral && styles.moralTextNoMoral]}>
                    {item.text}
                </Text>
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
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
            </View>

            <Text style={styles.instruction}>
                Welche Moral soll die Geschichte vermitteln?
            </Text>

            <FlatList
                data={morals}
                renderItem={renderMoral}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {selectedMoralId ? 'Weiter' : 'Überspringen'}
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
    instruction: {
        fontSize: 15,
        color: '#A78BFA',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    list: {
        padding: 16,
        paddingTop: 4,
    },
    moralCard: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#4C4270',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    moralCardSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    moralCardNoMoral: {
        borderStyle: 'dashed',
        backgroundColor: '#252035',
    },
    moralText: {
        fontSize: 15,
        color: '#F5F3FF',
        flex: 1,
        paddingRight: 12,
    },
    moralTextNoMoral: {
        color: '#8B7FA8',
        fontStyle: 'italic',
    },
    checkmark: {
        width: 26,
        height: 26,
        borderRadius: 13,
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
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
