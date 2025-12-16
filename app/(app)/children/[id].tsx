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
    Switch,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import type { Child, GenderType, ChildInterest, SideCharacter, SideCharType } from '@/types/supabase';
import useI18n from '@/hooks/useI18n';

const GENDERS: { value: GenderType; label: string; emoji: string }[] = [
    { value: 'Junge', label: 'Junge', emoji: '👦' },
    { value: 'Maedchen', label: 'Mädchen', emoji: '👧' },
    { value: 'Ohne Angabe', label: 'Ohne Angabe', emoji: '🧒' },
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

const DEFAULT_INTERESTS = [
    'Dinosaurier', 'Prinzessinnen', 'Ritter', 'Tiere', 'Weltraum',
    'Natur', 'Fahrzeuge', 'Sport', 'Musik', 'Malen', 'Piraten', 'Roboter'
];

export default function EditChildScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [child, setChild] = useState<Child | null>(null);
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState<GenderType>('Ohne Angabe');
    const [usePhotoForMedia, setUsePhotoForMedia] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [interests, setInterests] = useState<ChildInterest[]>([]);
    const [sideCharacters, setSideCharacters] = useState<SideCharacter[]>([]);
    const [newInterest, setNewInterest] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Nebencharakter Flow: Rolle zuerst
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<SideCharType | null>(null);
    const [newCharName, setNewCharName] = useState('');
    const [customRoleName, setCustomRoleName] = useState(''); // Für "Eigene" Rolle

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

    useEffect(() => {
        loadChild();
    }, [id]);

    const loadChild = async () => {
        setIsLoading(true);
        try {
            const { data: childData } = await supabase
                .from('children')
                .select('*')
                .eq('id', id)
                .single();

            if (childData) {
                setChild(childData);
                setName(childData.name);
                // Convert age to approximate birthDate (will be replaced with real birthDate from DB later)
                const approxBirthDate = new Date();
                approxBirthDate.setFullYear(approxBirthDate.getFullYear() - childData.age);
                setBirthDate(approxBirthDate);
                setGender(childData.gender);
                setUsePhotoForMedia(childData.use_photo_for_media);
                setPhotoUrl(childData.photo_url);
            }

            const { data: interestsData } = await supabase
                .from('child_interests')
                .select('*')
                .eq('child_id', id);

            if (interestsData) setInterests(interestsData);

            const { data: charsData } = await supabase
                .from('side_characters')
                .select('*')
                .eq('child_id', id);

            if (charsData) setSideCharacters(charsData);
        } catch (error) {
            console.error('Error loading child:', error);
            Alert.alert('Fehler', 'Kind konnte nicht geladen werden.');
            router.back();
        }
        setIsLoading(false);
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
            const uri = result.assets[0].uri;
            setPhotoUrl(uri);

            // Upload to Supabase Storage
            try {
                const photoExt = uri.split('.').pop();
                const photoName = `${child?.user_id}/${id}/avatar.${photoExt}`;

                const formData = new FormData();
                formData.append('file', {
                    uri: uri,
                    name: `avatar.${photoExt}`,
                    type: `image/${photoExt}`,
                } as any);

                await supabase.storage
                    .from('avatars')
                    .upload(photoName, formData, { upsert: true });

                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(photoName);

                await supabase.from('children').update({ photo_url: urlData.publicUrl }).eq('id', id);
                setPhotoUrl(urlData.publicUrl);
            } catch (error) {
                console.error('Error uploading photo:', error);
            }
        }
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

        setIsSaving(true);
        try {
            await supabase.from('children').update({
                name: name.trim(),
                age: ageNum,
                gender,
                use_photo_for_media: usePhotoForMedia,
            }).eq('id', id);

            router.back();
        } catch (error) {
            console.error('Error saving child:', error);
            Alert.alert('Fehler', 'Änderungen konnten nicht gespeichert werden.');
        }
        setIsSaving(false);
    };

    const handleToggleInterest = async (interest: string) => {
        const existing = interests.find(i => i.interest === interest);

        if (existing) {
            await supabase.from('child_interests').delete().eq('id', existing.id);
            setInterests(prev => prev.filter(i => i.id !== existing.id));
        } else {
            const { data } = await supabase
                .from('child_interests')
                .insert({ child_id: id, interest, is_custom: !DEFAULT_INTERESTS.includes(interest) })
                .select()
                .single();

            if (data) setInterests(prev => [...prev, data]);
        }
    };

    const handleAddCustomInterest = async () => {
        if (!newInterest.trim()) return;
        await handleToggleInterest(newInterest.trim());
        setNewInterest('');
    };

    // Nebencharakter Flow: Rolle zuerst wählen
    const handleSelectRole = (role: SideCharType) => {
        setSelectedRole(role);
    };

    const handleAddSideCharacter = async () => {
        if (!selectedRole || !newCharName.trim()) return;
        // Bei "Eigene" wird customRoleName als char_type gespeichert
        if (selectedRole === 'Eigene' && !customRoleName.trim()) return;

        const roleToSave = selectedRole === 'Eigene' ? customRoleName.trim() : selectedRole;

        const { data } = await supabase
            .from('side_characters')
            .insert({ child_id: id, name: newCharName.trim(), char_type: roleToSave })
            .select()
            .single();

        if (data) setSideCharacters(prev => [...prev, data]);

        setNewCharName('');
        setCustomRoleName('');
        setSelectedRole(null);
        setShowRoleModal(false);
    };

    const handleDeleteSideCharacter = async (charId: string) => {
        await supabase.from('side_characters').delete().eq('id', charId);
        setSideCharacters(prev => prev.filter(c => c.id !== charId));
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#A78BFA" />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: name || 'Kind bearbeiten' }} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Photo Section */}
                    <TouchableOpacity style={styles.photoSection} onPress={handlePickPhoto}>
                        {photoUrl ? (
                            <Image source={{ uri: photoUrl }} style={styles.photo} />
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
                    <Text style={styles.photoHint}>Tippe um Foto zu ändern</Text>

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📝 Grunddaten</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Geburtsdatum</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#A78BFA" />
                                <Text style={[styles.dateButtonText, !birthDate && styles.dateButtonPlaceholder]}>
                                    {birthDate ? birthDate.toLocaleDateString('de-CH') : 'Datum wählen'}
                                </Text>
                                {birthDate && (
                                    <Text style={styles.ageDisplay}>({getDisplayAge()})</Text>
                                )}
                            </TouchableOpacity>
                            {showDatePicker && (
                                <View style={styles.datePickerContainer}>
                                    {Platform.OS === 'ios' && (
                                        <View style={styles.datePickerHeader}>
                                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                <Text style={styles.datePickerDone}>Fertig</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    <DateTimePicker
                                        value={birthDate || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        maximumDate={new Date()}
                                        minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === 'android') {
                                                setShowDatePicker(false);
                                            }
                                            if (selectedDate) {
                                                setBirthDate(selectedDate);
                                            }
                                        }}
                                        themeVariant="dark"
                                        textColor="#F5F3FF"
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
                            <Text style={styles.switchLabel}>Foto für KI-Bilder verwenden</Text>
                            <Switch
                                value={usePhotoForMedia}
                                onValueChange={setUsePhotoForMedia}
                                trackColor={{ false: '#3D3255', true: '#7C3AED' }}
                                thumbColor={usePhotoForMedia ? '#F5F3FF' : '#8B7FA8'}
                            />
                        </View>
                    </View>

                    {/* Interests Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⭐ Interessen</Text>
                        <View style={styles.interestsGrid}>
                            {DEFAULT_INTERESTS.map((interest) => (
                                <TouchableOpacity
                                    key={interest}
                                    style={[
                                        styles.interestChip,
                                        interests.find(i => i.interest === interest) && styles.interestChipActive,
                                    ]}
                                    onPress={() => handleToggleInterest(interest)}
                                >
                                    <Text
                                        style={[
                                            styles.interestText,
                                            interests.find(i => i.interest === interest) && styles.interestTextActive,
                                        ]}
                                    >
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
                                value={newInterest}
                                onChangeText={setNewInterest}
                                onSubmitEditing={handleAddCustomInterest}
                            />
                            <TouchableOpacity style={styles.addButton} onPress={handleAddCustomInterest}>
                                <Ionicons name="add" size={24} color="#7C3AED" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Side Characters Section - Rolle zuerst */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>👨‍👩‍👧 Nebencharaktere</Text>
                        <Text style={styles.sectionHint}>
                            Familienmitglieder oder Freunde für Geschichten
                        </Text>

                        {sideCharacters.map((char) => (
                            <View key={char.id} style={styles.charCard}>
                                <View>
                                    <Text style={styles.charName}>{char.name}</Text>
                                    <Text style={styles.charType}>
                                        {SIDE_CHAR_TYPES.find(t => t.value === char.char_type)?.label || char.char_type}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteSideCharacter(char.id)}>
                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addCharButton}
                            onPress={() => setShowRoleModal(true)}
                        >
                            <Ionicons name="add-circle" size={24} color="#7C3AED" />
                            <Text style={styles.addCharButtonText}>Nebencharakter hinzufügen</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Accessibility Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>♿ Bedürfnisse & Barrierefreiheit</Text>
                        <Text style={styles.sectionHint}>
                            Optionale Einstellungen für inklusives Vorlesen
                        </Text>
                        <TouchableOpacity
                            style={styles.accessibilityLink}
                            onPress={() => router.push(`/(app)/children/${id}/accessibility`)}
                        >
                            <View style={styles.accessibilityContent}>
                                <Ionicons name="accessibility" size={24} color="#A78BFA" />
                                <View style={styles.accessibilityText}>
                                    <Text style={styles.accessibilityTitle}>Einstellungen bearbeiten</Text>
                                    <Text style={styles.accessibilityHint}>Mobilität, Sehen, Hören, Reizverarbeitung</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#8B7FA8" />
                        </TouchableOpacity>
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
                                <Text style={styles.saveButtonText}>Speichern</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal: Rolle zuerst wählen, dann Name */}
            <Modal visible={showRoleModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedRole ? 'Name eingeben' : 'Rolle wählen'}
                        </Text>

                        {!selectedRole ? (
                            <View style={styles.roleGrid}>
                                {SIDE_CHAR_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={styles.roleButton}
                                        onPress={() => handleSelectRole(type.value)}
                                    >
                                        <Text style={styles.roleButtonText}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.nameInputSection}>
                                <Text style={styles.selectedRoleText}>
                                    Rolle: {SIDE_CHAR_TYPES.find(t => t.value === selectedRole)?.label}
                                </Text>
                                {selectedRole === 'Eigene' && (
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Rollenname eingeben (z.B. Trainer, Lehrerin)..."
                                        placeholderTextColor="#8B7FA8"
                                        value={customRoleName}
                                        onChangeText={setCustomRoleName}
                                        autoFocus
                                    />
                                )}
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Name eingeben..."
                                    placeholderTextColor="#8B7FA8"
                                    value={newCharName}
                                    onChangeText={setNewCharName}
                                    autoFocus={selectedRole !== 'Eigene'}
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        (!newCharName.trim() || (selectedRole === 'Eigene' && !customRoleName.trim())) && styles.modalButtonDisabled
                                    ]}
                                    onPress={handleAddSideCharacter}
                                    disabled={!newCharName.trim() || (selectedRole === 'Eigene' && !customRoleName.trim())}
                                >
                                    <Text style={styles.modalButtonText}>Hinzufügen</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.modalCancel}
                            onPress={() => {
                                setShowRoleModal(false);
                                setSelectedRole(null);
                                setNewCharName('');
                            }}
                        >
                            <Text style={styles.modalCancelText}>Abbrechen</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1A1625' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },

    photoSection: { alignSelf: 'center', marginBottom: 8 },
    photo: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#7C3AED' },
    photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#2D2640', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#7C3AED' },
    photoEmoji: { fontSize: 56 },
    photoEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#7C3AED', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1A1625' },
    photoHint: { fontSize: 13, color: '#8B7FA8', textAlign: 'center', marginBottom: 24 },

    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#A78BFA', marginBottom: 12 },
    sectionHint: { fontSize: 13, color: '#6B5B8A', marginBottom: 12 },

    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#E9E3F5', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#2D2640', borderRadius: 12, padding: 14, fontSize: 16, color: '#F5F3FF', borderWidth: 1, borderColor: '#4C4270' },

    genderContainer: { flexDirection: 'row', gap: 10 },
    genderButton: { flex: 1, backgroundColor: '#2D2640', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#4C4270' },
    genderButtonActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.15)' },
    genderEmoji: { fontSize: 24, marginBottom: 4 },
    genderLabel: { fontSize: 11, color: '#8B7FA8', fontWeight: '500' },
    genderLabelActive: { color: '#A78BFA' },

    switchContainer: { backgroundColor: '#2D2640', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#4C4270', marginTop: 8 },
    switchLabel: { fontSize: 14, fontWeight: '500', color: '#F5F3FF' },

    interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    interestChip: { backgroundColor: '#2D2640', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#4C4270' },
    interestChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    interestText: { fontSize: 13, color: '#8B7FA8' },
    interestTextActive: { color: '#FFFFFF' },

    customInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#2D2640', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4C4270' },

    charCard: { backgroundColor: '#2D2640', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#4C4270' },
    charName: { fontSize: 15, fontWeight: '500', color: '#F5F3FF' },
    charType: { fontSize: 12, color: '#8B7FA8', marginTop: 2 },

    addCharButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2D2640', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#4C4270', borderStyle: 'dashed' },
    addCharButtonText: { fontSize: 14, color: '#A78BFA', fontWeight: '500' },

    saveButton: { backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1A1625', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#F5F3FF', marginBottom: 20, textAlign: 'center' },
    roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    roleButton: { backgroundColor: '#2D2640', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#4C4270' },
    roleButtonText: { fontSize: 14, color: '#A78BFA', fontWeight: '500' },
    nameInputSection: { gap: 16 },
    selectedRoleText: { fontSize: 14, color: '#8B7FA8', textAlign: 'center' },
    modalInput: { backgroundColor: '#2D2640', borderRadius: 12, padding: 14, fontSize: 16, color: '#F5F3FF', borderWidth: 1, borderColor: '#7C3AED' },
    modalButton: { backgroundColor: '#7C3AED', borderRadius: 12, padding: 14, alignItems: 'center' },
    modalButtonDisabled: { opacity: 0.5 },
    modalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    modalCancel: { marginTop: 16, alignItems: 'center' },
    modalCancelText: { fontSize: 14, color: '#8B7FA8' },
    accessibilityLink: {
        backgroundColor: '#2D2640',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#4C4270'
    },
    accessibilityContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1
    },
    accessibilityText: { flex: 1 },
    accessibilityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 2
    },
    accessibilityHint: {
        fontSize: 12,
        color: '#8B7FA8'
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
});
