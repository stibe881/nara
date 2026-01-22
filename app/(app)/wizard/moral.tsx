import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/stores/wizard';
import type { Moral } from '@/types/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function WizardMoralScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { selectedMoralId, setMoral } = useWizardStore();
    const [morals, setMorals] = useState<Moral[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('morals').select('*').order('sort_order');
            if (data) setMorals(data);
            setIsLoading(false);
        }
        load();
    }, []);

    const handleNext = () => router.push('/(app)/wizard/length');

    if (isLoading) return <ActivityIndicator style={styles.centered} color={theme.primary} />;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.progress}>
                {[...Array(6)].map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: i <= 5 ? theme.primary : theme.border }]} />
                ))}
            </View>

            <Text style={[styles.instruction, { color: theme.text }]}>Gibt es eine Lektion?</Text>

            <FlatList
                data={morals}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const isSelected = selectedMoralId === item.id;
                    return (
                        <TouchableOpacity onPress={() => setMoral(item.id)}>
                            <Card style={[styles.card, isSelected && { borderColor: theme.primary, borderWidth: 2 }]} variant={isSelected ? 'outlined' : 'default'}>
                                <Text style={[styles.text, { color: theme.text, fontWeight: isSelected ? '700' : '400' }]}>{item.text}</Text>
                                {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                            </Card>
                        </TouchableOpacity>
                    )
                }}
            />

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Button title={selectedMoralId ? "Weiter" : "Weiter ohne Moral"} onPress={handleNext} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center' },
    progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 24 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    instruction: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
    list: { padding: 24, paddingTop: 0 },
    card: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    text: { fontSize: 16, flex: 1 },
    footer: { padding: 24, borderTopWidth: 1 },
});
