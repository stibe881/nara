import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWizardStore } from '@/stores/wizard';
import useI18n from '@/hooks/useI18n';

const LOCATION_SUGGESTIONS = [
    { label: 'Im Wald', icon: '🌲' },
    { label: 'Am Strand', icon: '🏖️' },
    { label: 'Im Weltraum', icon: '🚀' },
    { label: 'In einem Schloss', icon: '🏰' },
    { label: 'Unter Wasser', icon: '🐠' },
    { label: 'In den Bergen', icon: '⛰️' },
    { label: 'In einer Stadt', icon: '🏙️' },
    { label: 'Im Dschungel', icon: '🌴' },
];

export default function WizardLocationScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const { location, setLocation } = useWizardStore();
    const [customLocation, setCustomLocation] = useState(location);

    const handleSelectSuggestion = (suggestion: string) => {
        setLocation(suggestion);
        setCustomLocation(suggestion);
    };

    const handleNext = () => {
        setLocation(customLocation);
        router.push('/(app)/wizard/mode');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Progress Indicator */}
            <View style={styles.progress}>
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotDone]} />
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.instruction}>
                    Wo soll die Geschichte spielen? (optional)
                </Text>

                {/* Custom Input */}
                <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={22} color="#8B7FA8" />
                    <TextInput
                        style={styles.input}
                        placeholder="Eigenen Ort eingeben..."
                        placeholderTextColor="#6B5B8A"
                        value={customLocation}
                        onChangeText={setCustomLocation}
                        maxLength={100}
                    />
                    {customLocation.length > 0 && (
                        <TouchableOpacity onPress={() => setCustomLocation('')}>
                            <Ionicons name="close-circle" size={20} color="#6B5B8A" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Suggestions */}
                <Text style={styles.suggestionsTitle}>Oder wähle einen Vorschlag:</Text>
                <View style={styles.suggestionsGrid}>
                    {LOCATION_SUGGESTIONS.map((suggestion) => {
                        const isSelected = customLocation === suggestion.label;
                        return (
                            <TouchableOpacity
                                key={suggestion.label}
                                style={[
                                    styles.suggestionCard,
                                    isSelected && styles.suggestionCardSelected,
                                ]}
                                onPress={() => handleSelectSuggestion(suggestion.label)}
                            >
                                <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                                <Text
                                    style={[
                                        styles.suggestionLabel,
                                        isSelected && styles.suggestionLabelSelected,
                                    ]}
                                >
                                    {suggestion.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {customLocation ? 'Weiter' : 'Ueberspringen'}
                    </Text>
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
    progress: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3D3255',
    },
    progressDotActive: {
        backgroundColor: '#7C3AED',
    },
    progressDotDone: {
        backgroundColor: '#22C55E',
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#3D3255',
        marginHorizontal: 4,
    },
    progressLineDone: {
        backgroundColor: '#22C55E',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    instruction: {
        fontSize: 15,
        color: '#A78BFA',
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D2640',
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#4C4270',
        marginBottom: 24,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: '#F5F3FF',
    },
    suggestionsTitle: {
        fontSize: 14,
        color: '#8B7FA8',
        marginBottom: 12,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    suggestionCard: {
        width: '47%',
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    suggestionCardSelected: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    suggestionIcon: {
        fontSize: 28,
        marginBottom: 6,
    },
    suggestionLabel: {
        fontSize: 13,
        color: '#E9E3F5',
        textAlign: 'center',
    },
    suggestionLabelSelected: {
        color: '#A78BFA',
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#2D2640',
    },
    nextButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
