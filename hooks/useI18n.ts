import { useState, useEffect, useCallback } from 'react';
import i18n, { initializeLanguage, setLanguage, getCurrentLanguage, LANGUAGES } from '../lib/i18n';

// Simple custom event bus for React Native compatibility
type Listener = (locale: string) => void;
const listeners: Set<Listener> = new Set();

const languageEvents = {
    subscribe: (listener: Listener): (() => void) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },
    emit: (locale: string) => {
        listeners.forEach(listener => listener(locale));
    }
};

export function useI18n() {
    const [locale, setLocale] = useState(getCurrentLanguage());
    const [isReady, setIsReady] = useState(false);
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        initializeLanguage().then((lang) => {
            setLocale(lang);
            setIsReady(true);
        });
    }, []);

    // Listen for language changes from other components
    useEffect(() => {
        const unsubscribe = languageEvents.subscribe((newLocale) => {
            setLocale(newLocale);
            forceUpdate(n => n + 1); // Force re-render
        });
        return unsubscribe;
    }, []);

    const changeLanguage = useCallback(async (newLocale: 'de' | 'en' | 'fr' | 'it') => {
        await setLanguage(newLocale);
        setLocale(newLocale);
        // Notify all other components
        languageEvents.emit(newLocale);
    }, []);

    const t = useCallback((key: string, options?: object) => {
        return i18n.t(key, options);
    }, [locale]); // Re-create when locale changes

    return {
        t,
        locale,
        changeLanguage,
        isReady,
        languages: LANGUAGES,
    };
}

export default useI18n;
