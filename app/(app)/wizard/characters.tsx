import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/stores/wizard';
import type { CategoryCharacter, SideCharacter } from '@/types/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function WizardCharactersScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
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
            if (selectedCategoryId) {
                const { data } = await supabase.from('category_characters').select('*').eq('category_id', selectedCategoryId).order('sort_order');
                if (data) setCategoryCharacters(data);
            }
            if (selectedChildIds.length > 0) {
                const { data } = await supabase.from('side_characters').select('*').in('child_id', selectedChildIds);
                if (data) setSideCharacters(data);
            }
        } catch (error) {
            console.error('Error loading characters:', error);
        }
        setIsLoading(false);
    };

    const handleNext = () => router.push('/(app)/wizard/location');
    const totalSelected = selectedCategoryCharacterIds.length + selectedSideCharacterIds.length;

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
                    <View key={i} style={[styles.dot, { backgroundColor: i <= 2 ? theme.primary : theme.border }]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.instruction, { color: theme.text }]}>Wer soll noch dabei sein?</Text>

                {/* Category Characters Grid */}
                {categoryCharacters.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.icon }]}>Aus der Kategorie</Text>
                        <View style={styles.grid}>
                            {categoryCharacters.map((char) => {
                                const isSelected = selectedCategoryCharacterIds.includes(char.id);
                                return (
                                    <TouchableOpacity key={char.id} onPress={() => toggleCategoryCharacter(char.id)} style={styles.charCardWrapper}>
                                        <Card style={[styles.charCard, isSelected && { borderColor: theme.primary, borderWidth: 2 }]} variant={isSelected ? 'outlined' : 'default'}>
                                            <Text style={{ fontSize: 32, marginBottom: 8 }}>{char.emoji || '🎭'}</Text>
                                            <Text style={[styles.charName, { color: theme.text }]}>{char.name}</Text>
                                            {isSelected && (
                                                <View style={[styles.check, { backgroundColor: theme.primary }]}>
                                                    <Ionicons name="checkmark" size={10} color="#FFF" />
                                                </View>
                                            )}
                                        </Card>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Side Characters Chips */}
                {sideCharacters.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.icon }]}>Freunde & Familie</Text>
                        <View style={styles.chipContainer}>
                            {sideCharacters.map((char) => {
                                const isSelected = selectedSideCharacterIds.includes(char.id);
                                return (
                                    <TouchableOpacity
                                        key={char.id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: isSelected ? theme.primary : theme.surface, borderColor: theme.border, borderWidth: 1 }
                                        ]}
                                        onPress={() => toggleSideCharacter(char.id)}
                                    >
                                        <Text style={[styles.chipText, { color: isSelected ? '#FFF' : theme.text }]}>{char.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Button
                    title={totalSelected > 0 ? `Weiter (${totalSelected})` : "Weiter ohne Extras"}
                    onPress={handleNext}
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
    content: { padding: 24, paddingTop: 0 },
    instruction: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    charCardWrapper: { width: '48%' },
    charCard: { alignItems: 'center', padding: 16, marginBottom: 0 },
    charName: { fontWeight: '600', fontSize: 14, textAlign: 'center' },
    check: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    chipText: { fontWeight: '600', fontSize: 14 },
    footer: { padding: 24, borderTopWidth: 1 },
});
