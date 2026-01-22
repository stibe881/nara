/**
 * Nara V2 Theme: "Card & Canvas"
 * A high-clarity, modern, light-first design system.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6D28D9'; // Stronger Violet (700)
const tintColorDark = '#A78BFA'; // Lighter Violet (400) - Fallback if dark mode is forced

export const Colors = {
  light: {
    text: '#1E293B', // Slate 800 - High contrast text
    background: '#F8FAFC', // Slate 50 - Very soft off-white canvas
    tint: tintColorLight,
    surface: '#FFFFFF', // Pure white cards
    icon: '#64748B', // Slate 500
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    primary: '#7C3AED', // Violet 600 - Main Brand Color
    secondary: '#F59E0B', // Amber 500 - Warm accent
    accent: '#EC4899', // Pink 500 - Playful accent
    border: '#E2E8F0', // Slate 200 - Subtle borders
    error: '#EF4444', // Red 500
    // V2 Specifics
    cardShadow: '#64748B', // Shadow color
    subtext: '#475569', // Slate 600
  },
  // Dark mode is kept for system compatibility but user requested "Light & Modern"
  // We will prioritize Light mode in V2.
  dark: {
    text: '#F1F5F9', // Slate 100
    background: '#0F172A', // Slate 900
    tint: tintColorDark,
    surface: '#1E293B', // Slate 800
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
    primary: '#8B5CF6', // Violet 500
    secondary: '#F59E0B',
    accent: '#EC4899',
    border: '#334155', // Slate 700
    error: '#EF4444',
    cardShadow: '#000000',
    subtext: '#CBD5E1',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'New York', // Great reading font on iOS
    rounded: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: {
    sans: 'system-ui',
    serif: 'serif',
    rounded: 'system-ui',
    mono: 'monospace',
  },
});
