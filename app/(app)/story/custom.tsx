import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { Child, StoryCategory } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomStoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [children, setChildren] = useState<Child[]>([]);
    const [categories, setCategories] = useState<StoryCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);

        const [childrenResult, categoriesResult] = await Promise.all([
            supabase.from('children').select('*').eq('user_id', user.id),
            supabase.from('story_categories').select('*').order('sort_order'),
        ]);

        if (childrenResult.data) setChildren(childrenResult.data);
        if (categoriesResult.data) setCategories(categoriesResult.data);

        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert(t('common.error'), t('customStory.errorNoTitle'));
            return;
        }
        if (!content.trim()) {
            Alert.alert(t('common.error'), t('customStory.errorNoContent'));
            return;
        }
        if (!user) return;

        setIsSaving(true);

        // Create story content in the format expected
        const storyContent = {
            story: [{ text: content.trim() }],
            moral_summary: t('customStory.title'),
        };

        const { error } = await supabase.from('stories').insert({
            user_id: user.id,
            title: title.trim(),
            child_id: selectedChildId,
            category_id: selectedCategoryId,
            content: storyContent,
            status: 'finished',
            is_custom: true,
            length_setting: 'normal',
        });

        setIsSaving(false);

        if (error) {
            console.error('Error saving custom story:', error);
            Alert.alert(t('common.error'), t('customStory.errorNoContent'));
        } else {
            Alert.alert(t('customStory.saved'), t('customStory.savedMessage'), [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerEmoji}>✍️</Text>
                        <Text style={styles.headerTitle}>{t('customStory.title')}</Text>
                        <Text style={styles.headerSubtitle}>
                            {t('customStory.subtitle')}
                        </Text>
                    </View>

                    {/* Title Input */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('customStory.storyTitle')} *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('customStory.storyTitlePlaceholder')}
                            placeholderTextColor="#8B7FA8"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    {/* Child Selection */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('customStory.assignChild')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        !selectedChildId && styles.chipSelected,
                                    ]}
                                    onPress={() => setSelectedChildId(null)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        !selectedChildId && styles.chipTextSelected,
                                    ]}>
                                        {t('customStory.noChild')}
                                    </Text>
                                </TouchableOpacity>
                                {children.map((child) => (
                                    <TouchableOpacity
                                        key={child.id}
                                        style={[
                                            styles.chip,
                                            selectedChildId === child.id && styles.chipSelected,
                                        ]}
                                        onPress={() => setSelectedChildId(child.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedChildId === child.id && styles.chipTextSelected,
                                        ]}>
                                            {child.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Category Selection */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('customStory.category')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        !selectedCategoryId && styles.chipSelected,
                                    ]}
                                    onPress={() => setSelectedCategoryId(null)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        !selectedCategoryId && styles.chipTextSelected,
                                    ]}>
                                        {t('customStory.noCategory')}
                                    </Text>
                                </TouchableOpacity>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.chip,
                                            selectedCategoryId === cat.id && styles.chipSelected,
                                        ]}
                                        onPress={() => setSelectedCategoryId(cat.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedCategoryId === cat.id && styles.chipTextSelected,
                                        ]}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Content Input */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('customStory.storyContent')} *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('customStory.storyContentPlaceholder')}
                            placeholderTextColor="#8B7FA8"
                            value={content}
                            onChangeText={setContent}
                            multiline
                            numberOfLines={10}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{content.length} {t('customStory.characters')}</Text>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                                <Text style={styles.saveButtonText}>{t('customStory.save')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F5F3FF',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8B7FA8',
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A78BFA',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    textArea: {
        minHeight: 200,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#8B7FA8',
        textAlign: 'right',
        marginTop: 4,
    },
    chipContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        backgroundColor: '#2D2640',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    chipSelected: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    chipText: {
        fontSize: 14,
        color: '#8B7FA8',
    },
    chipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
