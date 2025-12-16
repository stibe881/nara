import { Stack } from 'expo-router';

export default function WizardLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#1A1625' },
                headerTintColor: '#F5F3FF',
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: '#1A1625' },
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
