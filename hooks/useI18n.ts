import { useState, useEffect, useCallback } from 'react';
import i18n, { initializeLanguage, setLanguage, getCurrentLanguage, LANGUAGES } from '../lib/i18n';

export function useI18n() {
    const [locale, setLocale] = useState(getCurrentLanguage());
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        initializeLanguage().then((lang) => {
            setLocale(lang);
            setIsReady(true);
        });
    }, []);

    const changeLanguage = useCallback(async (newLocale: 'de' | 'en' | 'fr' | 'it') => {
        await setLanguage(newLocale);
        setLocale(newLocale);
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
