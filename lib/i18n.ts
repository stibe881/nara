import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';

const i18n = new I18n({
    de,
    en,
    fr,
    it,
});

// Default to device locale, fallback to German
i18n.defaultLocale = 'de';
i18n.enableFallback = true;

// Get stored language or use device locale
export async function initializeLanguage() {
    const storedLanguage = await AsyncStorage.getItem('appLanguage');
    if (storedLanguage) {
        i18n.locale = storedLanguage;
    } else {
        // Use device locale, but only if we support it
        const locales = Localization.getLocales();
        const rawLocale = locales?.[0]?.languageCode || 'de';
        if (['de', 'en', 'fr', 'it'].includes(rawLocale)) {
            i18n.locale = rawLocale;
        } else {
            i18n.locale = 'de';
        }
    }
    return i18n.locale;
}

// Change language
export async function setLanguage(locale: 'de' | 'en' | 'fr' | 'it') {
    i18n.locale = locale;
    await AsyncStorage.setItem('appLanguage', locale);
}

// Get current language
export function getCurrentLanguage(): string {
    return i18n.locale;
}

// Available languages
export const LANGUAGES = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export default i18n;
