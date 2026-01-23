import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
// NOTE: Reusing logic from previous file but applying V2 design
import AnimatedSceneImage from '@/components/AnimatedSceneImage';

export default function StoryViewerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [story, setStory] = useState<any>(null);
    const [scenes, setScenes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadStory();
    }, [id]);

    const loadStory = async () => {
        const { data } = await supabase.from('stories').select('*, content').eq('id', id).single();
        if (data) setStory(data);
        const { data: scenesData } = await supabase.from('story_scenes').select('*').eq('story_id', id).order('scene_index');
        if (scenesData) setScenes(scenesData);
        setIsLoading(false);
    };

    const handleShare = async () => {
        try {
            const message = `${story.title}\n\n${story.content.moral_summary || ''}\n\nLies die ganze Geschichte auf Nara!`;
            await Share.share({
                message,
                title: story.title,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleExportPDF = async () => {
        if (!story) return;
        setIsExporting(true);
        try {
            // Simple HTML template for PDF
            const html = `
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                        h1 { text-align: center; color: #7C3AED; margin-bottom: 40px; }
                        p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
                        .moral { background: #FFF9E6; padding: 20px; border-left: 4px solid #F59E0B; margin-top: 40px; font-style: italic; }
                    </style>
                </head>
                <body>
                    <h1>${story.title}</h1>
                    ${story.content.story.map((p: any) => `<p>${p.text}</p>`).join('')}
                    <div class="moral">
                        <strong>Die Moral:</strong> ${story.content.moral_summary}
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Fehler', 'PDF konnte nicht erstellt werden.');
        }
        setIsExporting(false);
    };

    if (isLoading || !story) {
        return <View style={[styles.centered, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></View>;
    }

    const getScene = (index: number) => {
        let count = 0;
        for (let i = 0; i <= index; i++) if (story.content.story[i]?.scene_marker) count++;
        return story.content.story[index]?.scene_marker ? scenes[count - 1] : null;
    };

    return (
        <>
            <Stack.Screen options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerTintColor: theme.text,
            }} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.headerSpacer} />

                    <Text style={[styles.title, { color: theme.text }]}>{story.title}</Text>

                    <View style={styles.body}>
                        {story.content.story.map((p: any, i: number) => {
                            const scene = getScene(i);
                            const hasImage = scene && scene.image_url;

                            return (
                                <View key={i} style={styles.block}>
                                    {hasImage && (
                                        <View style={styles.sceneFrame}>
                                            <AnimatedSceneImage imageUrl={scene.image_url} />
                                        </View>
                                    )}
                                    <Text style={[styles.paragraph, { color: theme.text }]}>
                                        {p.text}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={[styles.moralBox, { backgroundColor: '#FFF9E6', borderLeftColor: theme.secondary }]}>
                        <Text style={[styles.moralTitle, { color: theme.secondary }]}>Die Moral</Text>
                        <Text style={[styles.moralText, { color: '#444' }]}>{story.content.moral_summary}</Text>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Floating Action Bar */}
                <View style={[styles.fabBar, { backgroundColor: theme.surface, shadowColor: theme.cardShadow }]}>
                    <TouchableOpacity style={styles.fabButton} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Button
                        title={isExporting ? "PDF wird erstellt..." : "Als PDF exportieren"}
                        onPress={handleExportPDF}
                        style={{ flex: 1, height: 48 }}
                        isLoading={isExporting}
                    />
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 24 },
    headerSpacer: { height: 60 },
    title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 32, lineHeight: 40 },
    body: { marginBottom: 32 },
    block: { marginBottom: 24 },
    paragraph: { fontSize: 20, lineHeight: 32 }, // Larger reading font
    sceneFrame: { height: 250, borderRadius: 24, overflow: 'hidden', marginBottom: 24, backgroundColor: '#1A1625' },
    moralBox: { padding: 24, borderRadius: 16, borderLeftWidth: 4, marginBottom: 40 },
    moralTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
    moralText: { fontSize: 18, fontStyle: 'italic', lineHeight: 28 },
    fabBar: {
        position: 'absolute', bottom: 32, left: 24, right: 24,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 20,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8
    },
    fabButton: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }
});
