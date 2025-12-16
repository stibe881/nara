import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { ChildAccessibility, AccessibilityIntensity } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';

const INTENSITY_OPTIONS: { value: AccessibilityIntensity; labelKey: string; descKey: string }[] = [
    { value: 'implicit', labelKey: 'accessibility.implicit', descKey: 'accessibility.implicitDesc' },
    { value: 'normal', labelKey: 'accessibility.normalIntensity', descKey: 'accessibility.normalIntensityDesc' },
    { value: 'active', labelKey: 'accessibility.active', descKey: 'accessibility.activeDesc' },
];

const ACCESSIBILITY_SECTIONS = [
    {
        titleKey: 'accessibility.mobility',
        icon: '🦽',
        fields: [
            { key: 'mobility_wheelchair', labelKey: 'accessibility.wheelchair' },
            { key: 'mobility_crutches', labelKey: 'accessibility.crutches' },
            { key: 'mobility_needs_breaks', labelKey: 'accessibility.needsBreaks' },
        ],
    },
    {
        titleKey: 'accessibility.vision',
        icon: '👁️',
        fields: [
            { key: 'vision_blind', labelKey: 'accessibility.blind' },
            { key: 'vision_low_vision', labelKey: 'accessibility.lowVision' },
        ],
    },
    {
        titleKey: 'accessibility.hearing',
        icon: '👂',
        fields: [
            { key: 'hearing_hard_of_hearing', labelKey: 'accessibility.hardOfHearing' },
            { key: 'reading_need_calm_clear', labelKey: 'accessibility.calmClear' },
            { key: 'no_sudden_loud_events', labelKey: 'accessibility.noLoud' },
        ],
    },
    {
        titleKey: 'accessibility.processing',
        icon: '🧠',
        fields: [
            { key: 'no_scary', labelKey: 'accessibility.noScary' },
            { key: 'no_surprises', labelKey: 'accessibility.noSurprises' },
            { key: 'need_simple_language', labelKey: 'accessibility.simpleLanguage' },
            { key: 'prefer_routines', labelKey: 'accessibility.routines' },
        ],
    },
];

type AccessibilityField = keyof ChildAccessibility;

export default function AccessibilityScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const { id: childId } = useLocalSearchParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [childName, setChildName] = useState('');

    // Accessibility state
    const [includeInStories, setIncludeInStories] = useState(false);
    const [intensity, setIntensity] = useState<AccessibilityIntensity>('implicit');
    const [fields, setFields] = useState<Record<string, boolean>>({
        mobility_wheelchair: false,
        mobility_crutches: false,
        mobility_needs_breaks: false,
        vision_blind: false,
        vision_low_vision: false,
        hearing_hard_of_hearing: false,
        reading_need_calm_clear: false,
        no_sudden_loud_events: false,
        no_scary: false,
        no_surprises: false,
        need_simple_language: false,
        prefer_routines: false,
    });

    useEffect(() => {
        loadData();
    }, [childId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load child name
            const { data: childData } = await supabase
                .from('children')
                .select('name')
                .eq('id', childId)
                .single();
            if (childData) setChildName(childData.name);

            // Load accessibility settings
            const { data: accessData } = await supabase
                .from('child_accessibility')
                .select('*')
                .eq('child_id', childId)
                .single();

            if (accessData) {
                setIncludeInStories(accessData.include_in_stories);
                setIntensity(accessData.intensity as AccessibilityIntensity);
                setFields({
                    mobility_wheelchair: accessData.mobility_wheelchair || false,
                    mobility_crutches: accessData.mobility_crutches || false,
                    mobility_needs_breaks: accessData.mobility_needs_breaks || false,
                    vision_blind: accessData.vision_blind || false,
                    vision_low_vision: accessData.vision_low_vision || false,
                    hearing_hard_of_hearing: accessData.hearing_hard_of_hearing || false,
                    reading_need_calm_clear: accessData.reading_need_calm_clear || false,
                    no_sudden_loud_events: accessData.no_sudden_loud_events || false,
                    no_scary: accessData.no_scary || false,
                    no_surprises: accessData.no_surprises || false,
                    need_simple_language: accessData.need_simple_language || false,
                    prefer_routines: accessData.prefer_routines || false,
                });
            }
        } catch (error) {
            // No existing record is OK
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const accessibilityData = {
                child_id: childId,
                include_in_stories: includeInStories,
                intensity,
                ...fields,
            };

            // Upsert the record
            const { error } = await supabase
                .from('child_accessibility')
                .upsert(accessibilityData, {
                    onConflict: 'child_id',
                });

            if (error) throw error;

            Alert.alert(t('common.success'), t('accessibility.saved'));
            router.back();
        } catch (error) {
            console.error('Error saving accessibility:', error);
            Alert.alert(t('common.error'), t('accessibility.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleField = (key: string) => {
        setFields(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A78BFA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Info */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#A78BFA" />
                    <Text style={styles.infoText}>
                        {t('accessibility.infoText', { name: childName || t('children.yourChild') })}
                    </Text>
                </View>

                {/* Main Toggle */}
                <View style={styles.mainToggle}>
                    <View style={styles.toggleContent}>
                        <Text style={styles.toggleTitle}>{t('accessibility.includeInStories')}</Text>
                        <Text style={styles.toggleHint}>
                            {includeInStories
                                ? t('accessibility.includeInStoriesOn')
                                : t('accessibility.includeInStoriesOff')}
                        </Text>
                    </View>
                    <Switch
                        value={includeInStories}
                        onValueChange={setIncludeInStories}
                        trackColor={{ false: '#3D3255', true: '#7C3AED' }}
                        thumbColor={includeInStories ? '#A78BFA' : '#6B5B8A'}
                    />
                </View>

                {/* Intensity Selection */}
                {includeInStories && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('accessibility.howToInclude')}</Text>
                        <View style={styles.intensityOptions}>
                            {INTENSITY_OPTIONS.map((option) => {
                                const isSelected = intensity === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.intensityOption, isSelected && styles.intensityOptionSelected]}
                                        onPress={() => setIntensity(option.value)}
                                    >
                                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <View style={styles.intensityContent}>
                                            <Text style={[styles.intensityLabel, isSelected && styles.intensityLabelSelected]}>
                                                {t(option.labelKey)}
                                            </Text>
                                            <Text style={styles.intensityDescription}>{t(option.descKey)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Accessibility Categories */}
                {ACCESSIBILITY_SECTIONS.map((section) => (
                    <View key={section.titleKey} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>{section.icon}</Text>
                            <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
                        </View>
                        <View style={styles.fieldList}>
                            {section.fields.map((field) => (
                                <TouchableOpacity
                                    key={field.key}
                                    style={styles.fieldItem}
                                    onPress={() => toggleField(field.key)}
                                >
                                    <Text style={styles.fieldLabel}>{t(field.labelKey)}</Text>
                                    <Switch
                                        value={fields[field.key]}
                                        onValueChange={() => toggleField(field.key)}
                                        trackColor={{ false: '#3D3255', true: '#7C3AED' }}
                                        thumbColor={fields[field.key] ? '#A78BFA' : '#6B5B8A'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
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
                            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1625',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1625',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 120,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#E9E3F5',
        lineHeight: 18,
    },
    mainToggle: {
        backgroundColor: '#2D2640',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    toggleContent: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    toggleHint: {
        fontSize: 13,
        color: '#8B7FA8',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    sectionIcon: {
        fontSize: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#A78BFA',
    },
    intensityOptions: {
        gap: 10,
    },
    intensityOption: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    intensityOptionSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#6B5B8A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
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
    intensityContent: {
        flex: 1,
    },
    intensityLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#E9E3F5',
    },
    intensityLabelSelected: {
        color: '#F5F3FF',
    },
    intensityDescription: {
        fontSize: 12,
        color: '#8B7FA8',
        marginTop: 2,
    },
    fieldList: {
        backgroundColor: '#2D2640',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    fieldItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3D3255',
    },
    fieldLabel: {
        fontSize: 15,
        color: '#E9E3F5',
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#1A1625',
        borderTopWidth: 1,
        borderTopColor: '#2D2640',
    },
    saveButton: {
        backgroundColor: '#22C55E',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
