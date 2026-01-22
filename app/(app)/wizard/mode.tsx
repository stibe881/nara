import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { useWizardStore } from '@/stores/wizard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ModeScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { storyMode, seriesConfig, setStoryMode, setSeriesConfig } = useWizardStore();

    const [mode, setMode] = useState<'single' | 'series'>(storyMode || 'single');
    const [seriesTitle, setSeriesTitle] = useState(seriesConfig?.title || '');

    const handleNext = () => {
        setStoryMode(mode);
        if (mode === 'series') {
            setSeriesConfig({ mode: 'unlimited', title: seriesTitle || undefined });
        }
        router.push('/(app)/wizard/moral');
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.progress}>
                {[...Array(6)].map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: i <= 4 ? theme.primary : theme.border }]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.instruction, { color: theme.text }]}>Was darf es sein?</Text>

                <TouchableOpacity onPress={() => setMode('single')} activeOpacity={0.8}>
                    <Card style={[styles.card, mode === 'single' && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]} variant={mode === 'single' ? 'outlined' : 'default'}>
                        <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                            <Text style={{ fontSize: 32 }}>📖</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: theme.text }]}>Einzelgeschichte</Text>
                            <Text style={[styles.desc, { color: theme.icon }]}>Eine abgeschlossene Geschichte für zwischendurch.</Text>
                        </View>
                        {mode === 'single' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMode('series')} activeOpacity={0.8}>
                    <Card style={[styles.card, mode === 'series' && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]} variant={mode === 'series' ? 'outlined' : 'default'}>
                        <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                            <Text style={{ fontSize: 32 }}>📚</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: theme.text }]}>Serie starten</Text>
                            <Text style={[styles.desc, { color: theme.icon }]}>Mehrere Episoden, die aufeinander aufbauen.</Text>
                        </View>
                        {mode === 'series' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                    </Card>
                </TouchableOpacity>

                {mode === 'series' && (
                    <View style={{ marginTop: 24 }}>
                        <Text style={{ fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>Titel der Serie (Optional)</Text>
                        <Input value={seriesTitle} onChangeText={setSeriesTitle} placeholder="z.B. Die Abenteuer im Zauberwald" />
                    </View>
                )}

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Button title="Weiter" onPress={handleNext} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 24 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    content: { padding: 24, paddingTop: 0 },
    instruction: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    iconBox: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    desc: { fontSize: 14, lineHeight: 20 },
    footer: { padding: 24, borderTopWidth: 1 },
});
