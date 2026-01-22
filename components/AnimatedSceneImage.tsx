import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCENE_HEIGHT = 220;

interface AnimatedSceneImageProps {
    imageUrl: string;
    duration?: number; // Animation cycle duration in ms
}

/**
 * AnimatedSceneImage - Ken-Burns effect with subtle particle overlay
 * 
 * Creates a smooth zoom/pan animation on scene images to give them
 * a "living" feel during story reading.
 */
export default function AnimatedSceneImage({
    imageUrl,
    duration = 12000
}: AnimatedSceneImageProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateXAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(0)).current;

    // Particle positions for sparkle effect
    const particle1Opacity = useRef(new Animated.Value(0)).current;
    const particle2Opacity = useRef(new Animated.Value(0)).current;
    const particle3Opacity = useRef(new Animated.Value(0)).current;
    const particle1Y = useRef(new Animated.Value(SCENE_HEIGHT)).current;
    const particle2Y = useRef(new Animated.Value(SCENE_HEIGHT)).current;
    const particle3Y = useRef(new Animated.Value(SCENE_HEIGHT)).current;

    useEffect(() => {
        // Ken-Burns animation: slow zoom and pan
        const kenBurnsAnimation = Animated.loop(
            Animated.sequence([
                // Zoom in while panning right
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1.15,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateXAnim, {
                        toValue: -15,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: -10,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                // Zoom out while panning left
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateXAnim, {
                        toValue: 0,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: 0,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        // Particle animations (staggered for natural effect)
        const createParticleAnimation = (
            opacity: Animated.Value,
            yPos: Animated.Value,
            delay: number
        ) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.sequence([
                            Animated.timing(opacity, {
                                toValue: 0.8,
                                duration: 1500,
                                useNativeDriver: true,
                            }),
                            Animated.timing(opacity, {
                                toValue: 0,
                                duration: 1500,
                                useNativeDriver: true,
                            }),
                        ]),
                        Animated.timing(yPos, {
                            toValue: -20,
                            duration: 3000,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.timing(yPos, {
                        toValue: SCENE_HEIGHT,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const particle1Animation = createParticleAnimation(particle1Opacity, particle1Y, 0);
        const particle2Animation = createParticleAnimation(particle2Opacity, particle2Y, 1000);
        const particle3Animation = createParticleAnimation(particle3Opacity, particle3Y, 2000);

        kenBurnsAnimation.start();
        particle1Animation.start();
        particle2Animation.start();
        particle3Animation.start();

        return () => {
            kenBurnsAnimation.stop();
            particle1Animation.stop();
            particle2Animation.stop();
            particle3Animation.stop();
        };
    }, [imageUrl, duration]);

    // Simplified static view to debug quality issues
    return (
        <View style={styles.container}>
            <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="cover"
                transition={500}
                cachePolicy="memory-disk"
            />
            {/* Keeping vignette for style, but removing particles/animation */}
            <View style={styles.vignette} pointerEvents="none" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: SCENE_HEIGHT,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#2D2640',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    particleContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    vignette: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 20,
        borderColor: 'rgba(26, 22, 37, 0.3)',
        borderRadius: 16,
    },
});
