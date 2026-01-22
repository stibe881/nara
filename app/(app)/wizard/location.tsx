import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useI18n from '@/hooks/useI18n';
import { useWizardStore } from '@/stores/wizard';
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

const LOCATION_SUGGESTIONS = [
    { label: 'Im Wald', icon: '🌲' },
    { label: 'Am Strand', icon: '🏖️' },
    { label: 'Im Weltraum', icon: '🚀' },
    { label: 'In einem Schloss', icon: '🏰' },
    { label: 'Unter Wasser', icon: '🐠' },
    { label: 'In den Bergen', icon: '⛰️' },
];

export default function WizardLocationScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { location, setLocation } = useWizardStore();
    const [customLocation, setCustomLocation] = useState(location);

    const handleNext = () => {
        setLocation(customLocation);
        router.push('/(app)/wizard/mode');
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.progress}>
                {[...Array(6)].map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: i <= 3 ? theme.primary : theme.border }]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={[styles.instruction, { color: theme.text }]}>Wo spielt die Geschichte?</Text>

                <Input
                    placeholder="z.B. Auf einem Piratenschiff..."
                    value={customLocation}
                    onChangeText={setCustomLocation}
                    returnKeyType="done"
                    style={{ marginBottom: 32 }}
                />

                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Vorschläge</Text>
                <View style={styles.grid}>
                    {LOCATION_SUGGESTIONS.map((sug) => (
                        <TouchableOpacity key={sug.label} onPress={() => setCustomLocation(sug.label)} style={styles.sugCardWrapper}>
                            <Card style={[styles.sugCard, customLocation === sug.label && { backgroundColor: theme.primary }]} variant="default">
                                <Text style={{ fontSize: 24 }}>{sug.icon}</Text>
                                <Text style={[styles.sugLabel, { color: customLocation === sug.label ? '#FFF' : theme.text }]}>{sug.label}</Text>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Button title={customLocation ? "Weiter" : "Weiter (zufälliger Ort)"} onPress={handleNext} />
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
    sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    sugCardWrapper: { width: '48%' },
    sugCard: { alignItems: 'center', padding: 16, marginBottom: 0, gap: 8 },
    sugLabel: { fontWeight: '600', fontSize: 14, textAlign: 'center' },
    footer: { padding: 24, borderTopWidth: 1 },
});
