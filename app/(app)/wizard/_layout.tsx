import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';

export default function WizardLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '700', color: theme.text },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.background },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name="index"
                options={{ title: 'Kinder auswählen' }}
            />
            <Stack.Screen
                name="category"
                options={{ title: 'Kategorie' }}
            />
            <Stack.Screen
                name="characters"
                options={{ title: 'Charaktere' }}
            />
            <Stack.Screen
                name="location"
                options={{ title: 'Ort' }}
            />
            <Stack.Screen
                name="mode"
                options={{ title: 'Geschichtstyp' }}
            />
            <Stack.Screen
                name="moral"
                options={{ title: 'Moral' }}
            />
            <Stack.Screen
                name="length"
                options={{ title: 'Zusammenfassung' }}
            />
        </Stack>
    );
}
