import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/stores/wizard';
import type { StoryCategory } from '@/types/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const ITEM_WIDTH = (width - 48 - GAP) / COLUMN_COUNT; // 48 = paddingHorizontal * 2

export default function WizardCategoryScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const { selectedCategoryId, setCategory } = useWizardStore();
    const [categories, setCategories] = useState<StoryCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase.from('story_categories').select('*').order('sort_order');
            if (data) setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
        setIsLoading(false);
    };

    const handleNext = () => {
        if (selectedCategoryId) router.push('/(app)/wizard/characters');
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
            <View style={styles.progress}>
                {[...Array(6)].map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: i <= 1 ? theme.primary : theme.border }]} />
                ))}
            </View>

            <Text style={[styles.instruction, { color: theme.text }]}>
                Worum soll es gehen?
            </Text>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.list}
                columnWrapperStyle={{ gap: GAP }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const isSelected = selectedCategoryId === item.id;
                    return (
                        <TouchableOpacity onPress={() => setCategory(item.id)} activeOpacity={0.8}>
                            <Card
                                style={[
                                    styles.card,
                                    isSelected && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }
                                ]}
                                variant={isSelected ? 'outlined' : 'default'}
                            >
                                <Text style={styles.icon}>{item.icon}</Text>
                                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                                {isSelected && (
                                    <View style={[styles.check, { backgroundColor: theme.primary }]}>
                                        <Ionicons name="checkmark" size={14} color="#FFF" />
                                    </View>
                                )}
                            </Card>
                        </TouchableOpacity>
                    );
                }}
            />

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Button
                    title="Weiter"
                    onPress={handleNext}
                    disabled={!selectedCategoryId}
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
    card: { width: ITEM_WIDTH, height: ITEM_WIDTH * 1.1, alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 12 },
    icon: { fontSize: 40, marginBottom: 12 },
    name: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
    check: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    footer: { padding: 24, borderTopWidth: 1 },
});
