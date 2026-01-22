import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/stores/wizard';
import type { Child } from '@/types/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function WizardChildrenScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const { selectedChildIds, toggleChild, reset } = useWizardStore();
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
            <Card
                style={[
                    styles.childCard,
                    isSelected && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }, // Highlight
                ]}
                variant={isSelected ? 'outlined' : 'default'}
                onTouchEnd={() => toggleChild(item.id)}>
                <View style={styles.childContent}>
                    <View style={[styles.avatar, { backgroundColor: theme.border }]}>
                        {item.photo_url ? (
                            <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
                        ) : (
                            <Text style={{ fontSize: 24 }}>
                                {item.gender === 'Junge' ? '👦' : item.gender === 'Maedchen' ? '👧' : '🧒'}
                            </Text>
                        )}
                    </View>
                    <View style={styles.childInfo}>
                        <Text style={[styles.childName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.childMeta, { color: theme.icon }]}>{item.age} Jahre</Text>
                    </View>
                    <View
                        style={[
                            styles.checkbox,
                            {
                                backgroundColor: isSelected ? theme.primary : theme.background,
                                borderColor: isSelected ? theme.primary : theme.border,
                            },
                        ]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                </View>
            </Card>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Progress */}
            <View style={styles.progress}>
                {/* Simplified Progress for V2 - Just specific active dot? Or simple text? Keeping dots for now but cleaner */}
                {[...Array(6)].map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: i === 0 ? theme.primary : theme.border }]} />
                ))}
            </View>

            <Text style={[styles.instruction, { color: theme.text }]}>
                Wer ist heute dabei?
            </Text>

            {children.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>👶</Text>
                    <Text style={[styles.emptyText, { color: theme.icon }]}>Keine Kinder gefunden.</Text>
                    <Button title="Kind hinzufügen" onPress={() => router.push('/(app)/children/new')} style={{ marginTop: 24 }} />
                </View>
            ) : (
                <FlatList
                    data={children}
                    renderItem={renderChild}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Button
                    title="Weiter"
                    onPress={handleNext}
                    disabled={selectedChildIds.length === 0}
                    style={styles.nextButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 24 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    instruction: { fontSize: 24, fontWeight: '700', paddingHorizontal: 24, marginBottom: 24, textAlign: 'center' },
    list: { padding: 24, paddingTop: 0 },
    childCard: { padding: 16, marginBottom: 12 },
    childContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
    avatarImage: { width: 56, height: 56 },
    childInfo: { flex: 1 },
    childName: { fontSize: 18, fontWeight: '600' },
    childMeta: { fontSize: 14 },
    checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    footer: { padding: 24, borderTopWidth: 1 },
    nextButton: { width: '100%' },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 16, textAlign: 'center' },
});
