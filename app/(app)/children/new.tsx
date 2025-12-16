import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { GenderType, SideCharType } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';

const GENDERS: { value: GenderType; label: string; emoji: string }[] = [
    { value: 'Junge', label: 'Junge', emoji: '👦' },
    { value: 'Maedchen', label: 'Mädchen', emoji: '👧' },
    { value: 'Ohne Angabe', label: 'Ohne Angabe', emoji: '🧒' },
];

const DEFAULT_INTERESTS = [
    'Dinosaurier', 'Prinzessinnen', 'Ritter', 'Tiere', 'Weltraum',
    'Natur', 'Fahrzeuge', 'Sport', 'Musik', 'Malen', 'Piraten', 'Roboter'
];

const SIDE_CHAR_TYPES: { value: SideCharType; label: string }[] = [
    { value: 'Mutter', label: 'Mutter' },
    { value: 'Vater', label: 'Vater' },
    { value: 'Geschwister', label: 'Geschwister' },
    { value: 'Grossmutter', label: 'Großmutter' },
    { value: 'Grossvater', label: 'Großvater' },
    { value: 'Gotti', label: 'Gotti' },
    { value: 'Goetti', label: 'Götti' },
    { value: 'Tante', label: 'Tante' },
    { value: 'Onkel', label: 'Onkel' },
    { value: 'Cousin', label: 'Cousin' },
    { value: 'Cousine', label: 'Cousine' },
    { value: 'Freund', label: 'Freund/in' },
    { value: 'Fiktiv', label: 'Fantasiefreund' },
    { value: 'Eigene', label: 'Eigene Rolle' },
];

interface SideCharacter {
    name: string;
    type: SideCharType;
}

export default function NewChildScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();

    // Basic info
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState<GenderType>('Ohne Angabe');
    const [usePhotoForMedia, setUsePhotoForMedia] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);

    // Interests
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [customInterest, setCustomInterest] = useState('');

    // Side characters
    const [sideCharacters, setSideCharacters] = useState<SideCharacter[]>([]);
    const [newCharName, setNewCharName] = useState('');
    const [showCharTypeSelector, setShowCharTypeSelector] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    // Calculate age from birthDate
    const calculateAge = (date: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
            age--;
        }
        return Math.max(0, age);
    };

    const getDisplayAge = () => {
        if (!birthDate) return '';
        const age = calculateAge(birthDate);
        return `${age} Jahre`;
    };

    const handlePickPhoto = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Berechtigung benötigt', 'Bitte erlaube den Zugriff auf deine Fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const addCustomInterest = () => {
        if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
            setSelectedInterests(prev => [...prev, customInterest.trim()]);
            setCustomInterest('');
        }
    };

    const addSideCharacter = (type: SideCharType) => {
        if (newCharName.trim()) {
            setSideCharacters(prev => [...prev, { name: newCharName.trim(), type }]);
            setNewCharName('');
            setShowCharTypeSelector(false);
        }
    };

    const removeSideCharacter = (index: number) => {
        setSideCharacters(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Namen ein.');
            return;
        }

        if (!birthDate) {
            Alert.alert('Fehler', 'Bitte gib ein Geburtsdatum ein.');
            return;
        }

        const ageNum = calculateAge(birthDate);
        if (ageNum < 0 || ageNum > 18) {
            Alert.alert('Fehler', 'Das Kind sollte zwischen 0 und 18 Jahre alt sein.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create child
            const { data: child, error: childError } = await supabase
                .from('children')
                .insert({
                    user_id: user?.id,
                    name: name.trim(),
                    age: ageNum,
                    gender,
                    use_photo_for_media: usePhotoForMedia,
                })
                .select()
                .single();

            if (childError) throw childError;

            // 2. Upload photo if selected
            if (photoUri && child) {
                const photoExt = photoUri.split('.').pop();
                const photoName = `${user?.id}/${child.id}/avatar.${photoExt}`;

                const formData = new FormData();
                formData.append('file', {
                    uri: photoUri,
                    name: `avatar.${photoExt}`,
                    type: `image/${photoExt}`,
                } as any);

                await supabase.storage
                    .from('avatars')
                    .upload(photoName, formData, { upsert: true });

                // Update child with photo URL
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(photoName);
                await supabase.from('children').update({ photo_url: urlData.publicUrl }).eq('id', child.id);
            }

            // 3. Add interests
            if (selectedInterests.length > 0 && child) {
                const interestInserts = selectedInterests.map(interest => ({
                    child_id: child.id,
                    interest,
                    is_custom: !DEFAULT_INTERESTS.includes(interest),
                }));
                await supabase.from('child_interests').insert(interestInserts);
            }

            // 4. Add side characters
            if (sideCharacters.length > 0 && child) {
                const charInserts = sideCharacters.map(char => ({
                    child_id: child.id,
                    name: char.name,
                    char_type: char.type,
                }));
                await supabase.from('side_characters').insert(charInserts);
            }

            router.back();
        } catch (error) {
            console.error('Error creating child:', error);
            Alert.alert('Fehler', 'Das Kind konnte nicht angelegt werden.');
        }
        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Photo & Avatar Section */}
                <TouchableOpacity style={styles.photoSection} onPress={handlePickPhoto}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photo} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Text style={styles.photoEmoji}>
                                {GENDERS.find(g => g.value === gender)?.emoji || '🧒'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.photoEditBadge}>
                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.photoHint}>Tippe um ein Foto hinzuzufügen</Text>

                {/* Section: Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Grunddaten</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Wie heißt dein Kind?"
                            placeholderTextColor="#8B7FA8"
                            value={name}
                            onChangeText={setName}
                            maxLength={50}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Geburtsdatum *</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#A78BFA" />
                            <Text style={[styles.dateButtonText, !birthDate && styles.dateButtonPlaceholder]}>
                                {birthDate ? birthDate.toLocaleDateString('de-CH') : 'Datum wählen'}
                            </Text>
                            {birthDate && (
                                <Text style={styles.ageDisplay}>
                                    ({getDisplayAge()})
                                </Text>
                            )}
                        </TouchableOpacity>
                        {showDatePicker && (
                            <View style={styles.datePickerContainer}>
                                <View style={styles.datePickerHeader}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.datePickerDone}>Fertig</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={birthDate || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') {
                                            setShowDatePicker(false);
                                        }
                                        if (selectedDate) {
                                            setBirthDate(selectedDate);
                                        }
                                    }}
                                    maximumDate={new Date()}
                                    minimumDate={new Date(2000, 0, 1)}
                                    locale="de-DE"
                                    themeVariant="dark"
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Geschlecht</Text>
                        <View style={styles.genderContainer}>
                            {GENDERS.map((g) => (
                                <TouchableOpacity
                                    key={g.value}
                                    style={[
                                        styles.genderButton,
                                        gender === g.value && styles.genderButtonActive,
                                    ]}
                                    onPress={() => setGender(g.value)}
                                >
                                    <Text style={styles.genderEmoji}>{g.emoji}</Text>
                                    <Text style={[
                                        styles.genderLabel,
                                        gender === g.value && styles.genderLabelActive,
                                    ]}>
                                        {g.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.switchContainer}>
                        <View style={styles.switchInfo}>
                            <Ionicons name="camera-outline" size={22} color="#A78BFA" />
                            <View style={styles.switchText}>
                                <Text style={styles.switchLabel}>Foto für KI-Bilder verwenden</Text>
                                <Text style={styles.switchHint}>
                                    Wenn aktiviert, kann das Foto in generierten Bildern erscheinen
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={usePhotoForMedia}
                            onValueChange={setUsePhotoForMedia}
                            trackColor={{ false: '#3D3255', true: '#7C3AED' }}
                            thumbColor={usePhotoForMedia ? '#F5F3FF' : '#8B7FA8'}
                        />
                    </View>
                </View>

                {/* Section: Interests */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⭐ Interessen (optional)</Text>
                    <Text style={styles.sectionHint}>
                        Wähle Themen, die dein Kind mag - sie fließen in die Geschichten ein
                    </Text>

                    <View style={styles.interestsGrid}>
                        {DEFAULT_INTERESTS.map((interest) => (
                            <TouchableOpacity
                                key={interest}
                                style={[
                                    styles.interestChip,
                                    selectedInterests.includes(interest) && styles.interestChipActive,
                                ]}
                                onPress={() => toggleInterest(interest)}
                            >
                                <Text style={[
                                    styles.interestText,
                                    selectedInterests.includes(interest) && styles.interestTextActive,
                                ]}>
                                    {interest}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.customInputRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Eigenes Interesse..."
                            placeholderTextColor="#8B7FA8"
                            value={customInterest}
                            onChangeText={setCustomInterest}
                            onSubmitEditing={addCustomInterest}
                        />
                        <TouchableOpacity style={styles.addButton} onPress={addCustomInterest}>
                            <Ionicons name="add" size={24} color="#7C3AED" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section: Side Characters */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👨‍👩‍👧 Nebencharaktere (optional)</Text>
                    <Text style={styles.sectionHint}>
                        Familienmitglieder oder Freunde, die in Geschichten vorkommen können
                    </Text>

                    {sideCharacters.map((char, index) => (
                        <View key={index} style={styles.charCard}>
                            <View>
                                <Text style={styles.charName}>{char.name}</Text>
                                <Text style={styles.charType}>
                                    {SIDE_CHAR_TYPES.find(t => t.value === char.type)?.label}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => removeSideCharacter(index)}>
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <View style={styles.customInputRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Name des Charakters..."
                            placeholderTextColor="#8B7FA8"
                            value={newCharName}
                            onChangeText={setNewCharName}
                        />
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => newCharName.trim() && setShowCharTypeSelector(true)}
                        >
                            <Ionicons name="add" size={24} color="#7C3AED" />
                        </TouchableOpacity>
                    </View>

                    {showCharTypeSelector && (
                        <View style={styles.typeSelector}>
                            <Text style={styles.typeSelectorTitle}>Rolle wählen:</Text>
                            <View style={styles.typeGrid}>
                                {SIDE_CHAR_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={styles.typeButton}
                                        onPress={() => addSideCharacter(type.value)}
                                    >
                                        <Text style={styles.typeButtonText}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Accessibility Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>♿ Bedürfnisse & Barrierefreiheit</Text>
                    <Text style={styles.sectionHint}>
                        Optionale Einstellungen für inklusives Vorlesen
                    </Text>
                    <View style={styles.accessibilityNote}>
                        <Ionicons name="information-circle" size={20} color="#A78BFA" />
                        <Text style={styles.accessibilityNoteText}>
                            Barrierefreiheit kann nach dem Speichern in den Kind-Einstellungen konfiguriert werden.
                        </Text>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>Kind hinzufügen</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
        padding: 20,
        paddingBottom: 40,
    },
    photoSection: {
        alignSelf: 'center',
        marginBottom: 8,
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#7C3AED',
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#2D2640',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#7C3AED',
    },
    photoEmoji: {
        fontSize: 56,
    },
    photoEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#7C3AED',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1A1625',
    },
    photoHint: {
        fontSize: 13,
        color: '#8B7FA8',
        textAlign: 'center',
        marginBottom: 24,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#A78BFA',
        marginBottom: 8,
    },
    sectionHint: {
        fontSize: 13,
        color: '#6B5B8A',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E9E3F5',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    genderButton: {
        flex: 1,
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4C4270',
    },
    genderButtonActive: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
    },
    genderEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    genderLabel: {
        fontSize: 11,
        color: '#8B7FA8',
        fontWeight: '500',
    },
    genderLabelActive: {
        color: '#A78BFA',
    },
    switchContainer: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4C4270',
        marginTop: 8,
    },
    switchInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    switchText: {
        flex: 1,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#F5F3FF',
        marginBottom: 2,
    },
    switchHint: {
        fontSize: 11,
        color: '#8B7FA8',
        lineHeight: 14,
    },
    interestsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    interestChip: {
        backgroundColor: '#2D2640',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    interestChipActive: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    interestText: {
        fontSize: 13,
        color: '#8B7FA8',
    },
    interestTextActive: {
        color: '#FFFFFF',
    },
    customInputRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#2D2640',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    charCard: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    charName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#F5F3FF',
    },
    charType: {
        fontSize: 12,
        color: '#8B7FA8',
        marginTop: 2,
    },
    typeSelector: {
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#7C3AED',
    },
    typeSelectorTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#F5F3FF',
        marginBottom: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        backgroundColor: '#3D3255',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    typeButtonText: {
        fontSize: 13,
        color: '#A78BFA',
    },
    saveButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    dateButton: {
        backgroundColor: '#3D3255',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    dateButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#F5F3FF',
    },
    dateButtonPlaceholder: {
        color: '#8B7FA8',
    },
    ageDisplay: {
        fontSize: 14,
        color: '#A78BFA',
        fontWeight: '500',
    },
    datePickerContainer: {
        marginTop: 12,
        backgroundColor: '#3D3255',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    datePickerDone: {
        fontSize: 16,
        color: '#7C3AED',
        fontWeight: '600',
    },
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    dateInput: {
        backgroundColor: '#2D2640',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 18,
        color: '#F5F3FF',
        textAlign: 'center',
        width: 50,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    yearInput: {
        width: 70,
    },
    dateSeparator: {
        fontSize: 20,
        color: '#8B7FA8',
        marginHorizontal: 2,
    },
    accessibilityNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#2D2640',
        borderRadius: 12,
        padding: 12,
        gap: 10,
    },
    accessibilityNoteText: {
        flex: 1,
        fontSize: 13,
        color: '#8B7FA8',
        lineHeight: 18,
    },
});
