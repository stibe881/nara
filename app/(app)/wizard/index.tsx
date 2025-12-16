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
import { useAuth } from '@/context/auth';
import { useWizardStore } from '@/stores/wizard';
import type { Child } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';

export default function WizardChildrenScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();
    const { selectedChildIds, toggleChild, reset } = useWizardStore();
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Reset wizard state when starting fresh
        reset();
        loadChildren();
    }, []);

    const loadChildren = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('children')
                .select('*')
                .eq('user_id', user?.id)
                .order('name');

            if (data) setChildren(data);
        } catch (error) {
            console.error('Error loading children:', error);
        }
        setIsLoading(false);
    };

    const handleNext = () => {
        if (selectedChildIds.length === 0) return;
        router.push('/(app)/wizard/category');
    };

    const renderChild = ({ item }: { item: Child }) => {
        const isSelected = selectedChildIds.includes(item.id);

        return (
            <TouchableOpacity
                style={[styles.childCard, isSelected && styles.childCardSelected]}
                onPress={() => toggleChild(item.id)}
            >
                <View style={styles.checkbox}>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                </View>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.gender === 'Junge' ? '👦' : item.gender === 'Maedchen' ? '👧' : '🧒'}
                    </Text>
                </View>
                <View style={styles.childInfo}>
                    <Text style={styles.childName}>{item.name}</Text>
                    <Text style={styles.childMeta}>{item.age} Jahre</Text>
                </View>
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

    if (children.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyIcon}>👶</Text>
                <Text style={styles.emptyTitle}>Keine Kinder vorhanden</Text>
                <Text style={styles.emptyText}>
                    Bitte fuege zuerst ein Kind hinzu, um eine Geschichte zu erstellen.
                </Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/(app)/children/new')}
                >
                    <Text style={styles.addButtonText}>Kind hinzufügen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Progress Indicator */}
            <View style={styles.progress}>
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
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
                Waehle die Kinder aus, die in der Geschichte vorkommen sollen:
            </Text>

            <FlatList
                data={children}
                renderItem={renderChild}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            {/* Next Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        selectedChildIds.length === 0 && styles.nextButtonDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={selectedChildIds.length === 0}
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
        padding: 24,
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
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#3D3255',
        marginHorizontal: 4,
    },
    instruction: {
        fontSize: 15,
        color: '#A78BFA',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    childCard: {
        backgroundColor: '#2D2640',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    childCardSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#3D3255',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3D3255',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 22,
    },
    childInfo: {
        flex: 1,
    },
    childName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F5F3FF',
    },
    childMeta: {
        fontSize: 13,
        color: '#8B7FA8',
        marginTop: 2,
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
        marginBottom: 24,
    },
    addButton: {
        backgroundColor: '#7C3AED',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
