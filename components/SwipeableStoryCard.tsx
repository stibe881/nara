import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { Story } from '@/types/supabase';

interface SwipeableStoryCardProps {
    story: Story;
    onPress: () => void;
    onToggleFavorite: () => void;
    onDelete: () => void;
}

export default function SwipeableStoryCard({
    story,
    onPress,
    onToggleFavorite,
    onDelete,
}: SwipeableStoryCardProps) {
    const swipeableRef = useRef<Swipeable>(null);

    const handleDelete = () => {
        Alert.alert(
            'Geschichte löschen',
            'Möchtest du diese Geschichte wirklich löschen?',
            [
                { text: 'Abbrechen', style: 'cancel', onPress: () => swipeableRef.current?.close() },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete related data first
                            await supabase.from('story_scenes').delete().eq('story_id', story.id);
                            await supabase.from('story_children').delete().eq('story_id', story.id);
                            // Delete story
                            await supabase.from('stories').delete().eq('id', story.id);
                            onDelete();
                        } catch (error) {
                            console.error('Error deleting story:', error);
                            Alert.alert('Fehler', 'Geschichte konnte nicht gelöscht werden.');
                        }
                    },
                },
            ]
        );
    };

    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        _dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.8}>
                <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                    <Text style={styles.deleteText}>Löschen</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            rightThreshold={40}
            friction={2}
            overshootRight={false}
        >
            <TouchableOpacity style={styles.storyCard} onPress={onPress}>
                <View style={styles.storyIcon}>
                    <Text style={styles.storyIconText}>📖</Text>
                </View>
                <View style={styles.storyContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.storyTitle} numberOfLines={2}>
                            {story.title}
                        </Text>
                        {(story as any).is_custom && (
                            <View style={styles.customBadge}>
                                <Text style={styles.customBadgeText}>Eigene</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.storyMeta}>
                        {new Date(story.created_at).toLocaleDateString('de-DE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                        {story.reading_time_minutes && ` • ${story.reading_time_minutes} Min. Lesezeit`}
                    </Text>
                </View>
                <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite}>
                    <Ionicons
                        name={story.is_favorite ? 'heart' : 'heart-outline'}
                        size={24}
                        color={story.is_favorite ? '#F472B6' : '#6B5B8A'}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    storyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D2640',
        borderRadius: 16,
        padding: 16,
        gap: 14,
    },
    storyIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#3D3255',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyIconText: {
        fontSize: 24,
    },
    storyContent: {
        flex: 1,
    },
    storyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F5F3FF',
        marginBottom: 4,
    },
    storyMeta: {
        fontSize: 13,
        color: '#8B7FA8',
    },
    favoriteButton: {
        padding: 8,
    },
    deleteAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 90,
        height: '100%',
        borderRadius: 16,
        marginLeft: 10,
    },
    deleteText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    customBadge: {
        backgroundColor: '#10B981',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    customBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
