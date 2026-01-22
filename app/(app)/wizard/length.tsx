import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { getCoinBalance, spendCoin } from '@/lib/purchases';
import { supabase } from '@/lib/supabase';
import { useWizardStore } from '@/stores/wizard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const LENGTH_OPTIONS = [
    { value: 'kurz', label: 'Kurz (~5 Min)', icon: '🌙' },
    { value: 'normal', label: 'Mittel (~8 Min)', icon: '🌟' },
    { value: 'lang', label: 'Lang (~12 Min)', icon: '✨' },
];

export default function WizardLengthScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const {
        length, setLength, generateImages, setGenerateImages,
        storyMode, seriesConfig, selectedChildIds, selectedCategoryId,
        selectedCategoryCharacterIds, selectedSideCharacterIds,
        location, selectedMoralId, reset, setNewPendingRequestId
    } = useWizardStore();

    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            // 1. Check Coin Balance
            const balance = await getCoinBalance();
            if (balance.coins < (generateImages ? 2 : 1)) {
                Alert.alert(
                    "Keine Coins mehr",
                    "Du benötigst Coins, um neue Geschichten zu erstellen.",
                    [
                        { text: "Abbrechen", style: "cancel" },
                        { text: "Shop öffnen", onPress: () => router.push('/(app)/subscription') }
                    ]
                );
                setIsLoading(false);
                return;
            }

            // 2. Spend Coin
            const cost = generateImages ? 2 : 1;
            const success = await spendCoin(cost);
            if (!success) {
                Alert.alert("Fehler", "Coins konnten nicht abgebucht werden.");
                setIsLoading(false);
                return;
            }

            // 3. Create Story Request
            // Simulating connection for UI demo
            const { data: request, error } = await supabase.from('story_requests').insert({
                user_id: user?.id,
                status: 'queued',
                category_id: selectedCategoryId,
                location: location || null,
                moral_id: selectedMoralId,
                length,
                notify_on_complete: true,
                generate_images: generateImages,
            }).select().single();

            if (error) throw error;

            if (selectedChildIds.length > 0) {
                await supabase.from('story_request_children').insert(
                    selectedChildIds.map((childId) => ({ story_request_id: request.id, child_id: childId }))
                );
            }

            // Call Edge Function (Fire & Forget)
            supabase.functions.invoke('create-story', { body: { request_id: request.id } });

            setNewPendingRequestId(request.id);
            reset();
            router.replace('/(app)/(tabs)/home');

        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte Geschichte nicht starten.");
        }
        setIsLoading(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.progress}>
                {[...Array(6)].map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: theme.primary }]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Fast fertig!</Text>

                <Text style={[styles.label, { color: theme.icon }]}>Länge</Text>
                <View style={styles.row}>
                    {LENGTH_OPTIONS.map((opt) => (
                        <TouchableOpacity key={opt.value} onPress={() => setLength(opt.value)} style={{ flex: 1 }}>
                            <Card style={[styles.optCard, length === opt.value && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]} variant={length === opt.value ? 'outlined' : 'default'}>
                                <Text style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</Text>
                                <Text style={[styles.optLabel, { color: theme.text }]}>{opt.label}</Text>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>

                <Card style={styles.switchCard}>
                    <View>
                        <Text style={[styles.switchTitle, { color: theme.text }]}>Mit Bildern</Text>
                        <Text style={[styles.switchDesc, { color: theme.icon }]}>Generiert KI-Bilder zur Geschichte</Text>
                    </View>
                    <Switch
                        value={generateImages}
                        onValueChange={setGenerateImages}
                        trackColor={{ true: theme.primary, false: theme.border }}
                    />
                </Card>

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Button
                    title={isLoading ? "Wird erstellt..." : `Zaubern ✨ (${generateImages ? '2 Coins' : '1 Coins'})`}
                    onPress={handleCreate}
                    isLoading={isLoading}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 24 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    content: { padding: 24, paddingTop: 0 },
    title: { fontSize: 32, fontWeight: '800', marginBottom: 32, textAlign: 'center' },
    label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    optCard: { alignItems: 'center', padding: 16, height: 120, justifyContent: 'center', marginBottom: 0 },
    optLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    switchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    switchTitle: { fontSize: 16, fontWeight: '700' },
    switchDesc: { fontSize: 13 },
    footer: { padding: 24, borderTopWidth: 1 },
});
