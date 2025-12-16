import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWizardStore } from '@/stores/wizard';
import useI18n from '@/hooks/useI18n';

const MODE_OPTIONS = [
    {
        value: 'single',
        titleKey: 'wizard.singleStory',
        descriptionKey: 'wizard.singleStoryDesc',
        icon: '📖',
    },
    {
        value: 'series',
        titleKey: 'wizard.series',
        descriptionKey: 'wizard.seriesDesc',
        icon: '📚',
    },
];

const SERIES_TYPE_OPTIONS = [
    {
        value: 'fixed',
        titleKey: 'wizardMode.fixedLength',
        descriptionKey: 'wizardMode.fixedLengthDesc',
    },
    {
        value: 'unlimited',
        titleKey: 'wizardMode.unlimited',
        descriptionKey: 'wizardMode.unlimitedDesc',
    },
];

export default function ModeScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const { storyMode, seriesConfig, setStoryMode, setSeriesConfig } = useWizardStore();
    const [mode, setMode] = useState<'single' | 'series'>(storyMode || 'single');
    const [seriesType, setSeriesType] = useState<'fixed' | 'unlimited'>(seriesConfig?.mode || 'unlimited');
    const [episodeCount, setEpisodeCount] = useState(seriesConfig?.plannedEpisodes?.toString() || '5');
    const [seriesTitle, setSeriesTitle] = useState(seriesConfig?.title || '');

    // Synchronisiere mode State mit storyMode aus Store (für F6 Serien-Vorauswahl)
    useEffect(() => {
        if (storyMode) {
            setMode(storyMode);
        }
    }, [storyMode]);

    const handleNext = () => {
        setStoryMode(mode as 'single' | 'series');

        if (mode === 'series') {
            setSeriesConfig({
                mode: seriesType,
                plannedEpisodes: seriesType === 'fixed' ? parseInt(episodeCount) || 5 : undefined,
                title: seriesTitle || undefined,
            });
        }

        router.push('/(app)/wizard/moral');
    };

    const isValid = mode === 'single' || (mode === 'series' && (seriesType === 'unlimited' || (seriesType === 'fixed' && parseInt(episodeCount) >= 2)));

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.instruction}>
                    {t('wizard.selectMode')}
                </Text>

                {/* Mode Selection */}
                <View style={styles.optionsContainer}>
                    {MODE_OPTIONS.map((option) => {
                        const isSelected = mode === option.value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                onPress={() => setMode(option.value as 'single' | 'series')}
                            >
                                <Text style={styles.optionIcon}>{option.icon}</Text>
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                                        {t(option.titleKey)}
                                    </Text>
                                    <Text style={styles.optionDescription}>{t(option.descriptionKey)}</Text>
                                </View>
                                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Series Configuration */}
                {mode === 'series' && (
                    <View style={styles.seriesConfig}>
                        <Text style={styles.sectionTitle}>{t('wizard.seriesSettings')}</Text>

                        {/* Series Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('wizard.seriesTitleOptional')}</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('wizard.seriesTitlePlaceholder')}
                                placeholderTextColor="#6B5B8A"
                                value={seriesTitle}
                                onChangeText={setSeriesTitle}
                            />
                        </View>

                        {/* Series Type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('wizard.episodeCount')}</Text>
                            <View style={styles.typeOptions}>
                                {SERIES_TYPE_OPTIONS.map((option) => {
                                    const isSelected = seriesType === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
                                            onPress={() => setSeriesType(option.value as 'fixed' | 'unlimited')}
                                        >
                                            <Text style={[styles.typeTitle, isSelected && styles.typeTitleSelected]}>
                                                {t(option.titleKey)}
                                            </Text>
                                            <Text style={styles.typeDescription}>{t(option.descriptionKey)}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Episode Count (for fixed) */}
                        {seriesType === 'fixed' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('wizard.howManyEpisodes')}</Text>
                                <View style={styles.counterContainer}>
                                    <TouchableOpacity
                                        style={styles.counterButton}
                                        onPress={() => setEpisodeCount(Math.max(2, parseInt(episodeCount) - 1).toString())}
                                    >
                                        <Ionicons name="remove" size={24} color="#F5F3FF" />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.counterInput}
                                        value={episodeCount}
                                        onChangeText={(text) => {
                                            const num = parseInt(text.replace(/[^0-9]/g, ''));
                                            setEpisodeCount(isNaN(num) ? '' : Math.max(2, num).toString());
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                    <TouchableOpacity
                                        style={styles.counterButton}
                                        onPress={() => setEpisodeCount(Math.min(20, parseInt(episodeCount) + 1).toString())}
                                    >
                                        <Ionicons name="add" size={24} color="#F5F3FF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Next Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={!isValid}
                >
                    <Text style={styles.nextButtonText}>{t('common.next')}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    instruction: {
        fontSize: 18,
        color: '#F5F3FF',
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: 12,
    },
    optionCard: {
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    optionCardSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
    },
    optionIcon: {
        fontSize: 40,
        marginRight: 14,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    optionTitleSelected: {
        color: '#A78BFA',
    },
    optionDescription: {
        fontSize: 13,
        color: '#8B7FA8',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#6B5B8A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: '#7C3AED',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#7C3AED',
    },
    seriesConfig: {
        marginTop: 24,
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#A78BFA',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: '#E9E3F5',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#3D3255',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    typeOptions: {
        gap: 10,
    },
    typeOption: {
        backgroundColor: '#3D3255',
        borderRadius: 12,
        padding: 14,
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    typeOptionSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    typeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    typeTitleSelected: {
        color: '#A78BFA',
    },
    typeDescription: {
        fontSize: 12,
        color: '#8B7FA8',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    counterButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3D3255',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterInput: {
        width: 80,
        height: 56,
        backgroundColor: '#3D3255',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '600',
        color: '#F5F3FF',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#1A1625',
        borderTopWidth: 1,
        borderTopColor: '#2D2640',
    },
    nextButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
