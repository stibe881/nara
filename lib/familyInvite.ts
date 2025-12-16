import { supabase } from './supabase';
import * as Linking from 'expo-linking';
import { Share, Alert } from 'react-native';

export interface FamilyInvite {
    id: string;
    family_id: string;
    invite_code: string;
    expires_at: string;
    used_by: string | null;
    created_at: string;
}

/**
 * Create or get user's family
 */
export const getOrCreateFamily = async (userId: string): Promise<string | null> => {
    // Check if user already has a family
    const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', userId)
        .single();

    if (profile?.family_id) {
        return profile.family_id;
    }

    // Check if user is owner of a family
    const { data: existingFamily } = await supabase
        .from('families')
        .select('id')
        .eq('owner_id', userId)
        .single();

    if (existingFamily) {
        // Update profile with family_id
        await supabase.from('profiles').update({ family_id: existingFamily.id }).eq('id', userId);
        return existingFamily.id;
    }

    // Create new family
    const { data: newFamily, error } = await supabase
        .from('families')
        .insert({ owner_id: userId, name: 'Meine Familie' })
        .select()
        .single();

    if (error || !newFamily) {
        console.error('Error creating family:', error);
        return null;
    }

    // Add owner as family member
    await supabase.from('family_members').insert({
        family_id: newFamily.id,
        user_id: userId,
        role: 'owner',
    });

    // Update profile
    await supabase.from('profiles').update({ family_id: newFamily.id }).eq('id', userId);

    // Update existing children to belong to this family
    await supabase.from('children').update({ family_id: newFamily.id }).eq('user_id', userId);

    return newFamily.id;
};

/**
 * Generate a new invite code
 */
export const createInvite = async (userId: string): Promise<FamilyInvite | null> => {
    const familyId = await getOrCreateFamily(userId);
    if (!familyId) return null;

    // Generate unique code using DB function
    const { data: codeResult } = await supabase.rpc('generate_invite_code');
    const inviteCode = codeResult || `TF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const { data: invite, error } = await supabase
        .from('family_invites')
        .insert({
            family_id: familyId,
            invite_code: inviteCode,
            created_by: userId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating invite:', error);
        return null;
    }

    return invite;
};

/**
 * Share invite link
 */
export const shareInvite = async (userId: string): Promise<boolean> => {
    const invite = await createInvite(userId);
    if (!invite) {
        Alert.alert('Fehler', 'Einladung konnte nicht erstellt werden.');
        return false;
    }

    const deepLink = `traumfunke://invite/${invite.invite_code}`;
    const message = `🌙 Traumfunke - Magische Gute-Nacht-Geschichten

Ich lade dich ein, gemeinsam Geschichten für unsere Kinder zu erstellen!

Dein Einladungscode: ${invite.invite_code}

1. Lade die App "Traumfunke" herunter
2. Registriere dich
3. Gib den Code ein: ${invite.invite_code}

Oder öffne diesen Link:
${deepLink}`;

    try {
        await Share.share({
            message,
            title: 'Traumfunke - Familieneinladung',
        });
        return true;
    } catch (error) {
        console.error('Error sharing invite:', error);
        return false;
    }
};

/**
 * Accept an invite code
 */
export const acceptInvite = async (userId: string, inviteCode: string): Promise<boolean> => {
    // Find the invite
    const { data: invite, error: findError } = await supabase
        .from('family_invites')
        .select('*, families(*)')
        .eq('invite_code', inviteCode.toUpperCase())
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (findError || !invite) {
        Alert.alert('Ungültiger Code', 'Dieser Einladungscode ist ungültig oder abgelaufen.');
        return false;
    }

    // Check if user is already in a family
    const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', invite.family_id)
        .eq('user_id', userId)
        .single();

    if (existingMember) {
        Alert.alert('Bereits Mitglied', 'Du bist bereits Mitglied dieser Familie.');
        return true; // Not an error, just already joined
    }

    // Add user to family
    const { error: memberError } = await supabase.from('family_members').insert({
        family_id: invite.family_id,
        user_id: userId,
        role: 'member',
    });

    if (memberError) {
        console.error('Error joining family:', memberError);
        Alert.alert('Fehler', 'Beitritt zur Familie fehlgeschlagen.');
        return false;
    }

    // Update profile with family_id
    await supabase.from('profiles').update({ family_id: invite.family_id }).eq('id', userId);

    // Mark invite as used
    await supabase
        .from('family_invites')
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq('id', invite.id);

    Alert.alert('Willkommen!', `Du bist jetzt Teil der Familie "${(invite.families as any)?.name || 'Familie'}"!`);
    return true;
};

/**
 * Handle deep link for invite
 */
export const handleInviteDeepLink = async (url: string, userId: string): Promise<boolean> => {
    const parsed = Linking.parse(url);

    if (parsed.hostname === 'invite' && parsed.path) {
        const inviteCode = parsed.path.replace('/', '');
        return await acceptInvite(userId, inviteCode);
    }

    // Also check for path pattern traumfunke://invite/CODE
    if (parsed.path?.startsWith('invite/')) {
        const inviteCode = parsed.path.replace('invite/', '');
        return await acceptInvite(userId, inviteCode);
    }

    return false;
};

/**
 * Get family members
 */
export const getFamilyMembers = async (familyId: string) => {
    const { data, error } = await supabase
        .from('family_members')
        .select(`
            id,
            role,
            joined_at,
            user_id,
            profiles:user_id (
                display_name,
                email
            )
        `)
        .eq('family_id', familyId);

    if (error) {
        console.error('Error fetching family members:', error);
        return [];
    }

    return data || [];
};
