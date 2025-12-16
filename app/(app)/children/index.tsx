import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import type { Child } from '@/types/supabase';
import { useFocusEffect } from '@react-navigation/native';
import useI18n from '@/hooks/useI18n';

export default function ChildrenListScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadChildren();
        }, [])
    );

    const loadChildren = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('children')
                .select('*')
                .eq('user_id', user?.id)
                .order('name');

            if (data) setChildren(data);
        } catch (error) {
            console.error('Error loading children:', error);
        }
        setIsLoading(false);
    };

    const handleDelete = (child: Child) => {
        Alert.alert(
            'Kind löschen',
            `Möchtest du "${child.name}" wirklich löschen? Alle zugehörigen Interessen und Nebencharaktere werden ebenfalls gelöscht.`,
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase.from('children').delete().eq('id', child.id);
                            setChildren(prev => prev.filter(c => c.id !== child.id));
                        } catch (error) {
                            console.error('Error deleting child:', error);
                            Alert.alert('Fehler', 'Das Kind konnte nicht gelöscht werden.');
                        }
                    },
                },
            ]
        );
    };

    const renderChild = ({ item }: { item: Child }) => (
        <TouchableOpacity
            style={styles.childCard}
            onPress={() => router.push(`/(app)/children/${item.id}`)}
        >
            <View style={styles.avatar}>
                {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>
                        {item.gender === 'Junge' ? '👦' : item.gender === 'Maedchen' ? '👧' : '🧒'}
                    </Text>
                )}
            </View>
            <View style={styles.childInfo}>
                <Text style={styles.childName}>{item.name}</Text>
                <Text style={styles.childMeta}>
                    {item.age} Jahre • {item.gender}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/(app)/children/${item.id}`)}
                >
                    <Ionicons name="pencil" size={18} color="#A78BFA" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const ListEmptyComponent = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👶</Text>
            <Text style={styles.emptyTitle}>Keine Kinder</Text>
            <Text style={styles.emptyText}>
                Fuege dein erstes Kind hinzu, um personalisierte Geschichten zu erstellen.
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                </View>
            ) : (
                <FlatList
                    data={children}
                    renderItem={renderChild}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={ListEmptyComponent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Add Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/(app)/children/new')}
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
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
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    childCard: {
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#4C4270',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3D3255',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 28,
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    childInfo: {
        flex: 1,
    },
    childName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    childMeta: {
        fontSize: 13,
        color: '#8B7FA8',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#3D3255',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#8B7FA8',
        textAlign: 'center',
        lineHeight: 20,
    },
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
});
