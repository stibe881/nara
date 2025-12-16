export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type GenderType = 'Junge' | 'Maedchen' | 'Ohne Angabe';

export type SideCharType =
    | 'Mutter'
    | 'Vater'
    | 'Geschwister'
    | 'Grossmutter'
    | 'Grossvater'
    | 'Gotti'
    | 'Goetti'
    | 'Tante'
    | 'Onkel'
    | 'Cousin'
    | 'Cousine'
    | 'Freund'
    | 'Freundin'
    | 'Fiktiv'
    | 'Eigene'
    | 'Sonstige';

export type StoryStatus =
    | 'queued'
    | 'generating_text'
    | 'generating_images'
    | 'rendering_clips'
    | 'finished'
    | 'failed';

export type StoryLength = 'kurz' | 'normal' | 'lang';

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    display_name: string | null;
                    locale: string;
                    push_token: string | null;
                    daily_story_count: number;
                    daily_story_reset_at: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    display_name?: string | null;
                    locale?: string;
                    push_token?: string | null;
                    daily_story_count?: number;
                    daily_story_reset_at?: string;
                };
                Update: {
                    display_name?: string | null;
                    locale?: string;
                    push_token?: string | null;
                    daily_story_count?: number;
                    daily_story_reset_at?: string;
                };
            };
            children: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    age: number;
                    gender: GenderType;
                    photo_url: string | null;
                    use_photo_for_media: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    age: number;
                    gender?: GenderType;
                    photo_url?: string | null;
                    use_photo_for_media?: boolean;
                };
                Update: {
                    name?: string;
                    age?: number;
                    gender?: GenderType;
                    photo_url?: string | null;
                    use_photo_for_media?: boolean;
                };
            };
            child_interests: {
                Row: {
                    id: string;
                    child_id: string;
                    interest: string;
                    is_custom: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    child_id: string;
                    interest: string;
                    is_custom?: boolean;
                };
                Update: {
                    interest?: string;
                    is_custom?: boolean;
                };
            };
            side_characters: {
                Row: {
                    id: string;
                    child_id: string;
                    name: string;
                    char_type: SideCharType;
                    description: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    child_id: string;
                    name: string;
                    char_type: SideCharType;
                    description?: string | null;
                };
                Update: {
                    name?: string;
                    char_type?: SideCharType;
                    description?: string | null;
                };
            };
            story_categories: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    icon: string | null;
                    sort_order: number;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    description?: string | null;
                    icon?: string | null;
                    sort_order?: number;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    icon?: string | null;
                    sort_order?: number;
                };
            };
            category_characters: {
                Row: {
                    id: string;
                    category_id: string;
                    name: string;
                    emoji: string | null;
                    description: string | null;
                    image_prompt_hint: string | null;
                    sort_order: number;
                };
                Insert: {
                    id?: string;
                    category_id: string;
                    name: string;
                    description?: string | null;
                    image_prompt_hint?: string | null;
                    sort_order?: number;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    image_prompt_hint?: string | null;
                    sort_order?: number;
                };
            };
            morals: {
                Row: {
                    id: string;
                    slug: string;
                    text: string;
                    sort_order: number;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    text: string;
                    sort_order?: number;
                };
                Update: {
                    text?: string;
                    sort_order?: number;
                };
            };
            story_requests: {
                Row: {
                    id: string;
                    user_id: string;
                    status: StoryStatus;
                    category_id: string | null;
                    location: string | null;
                    moral_id: string | null;
                    length: StoryLength;
                    notify_on_complete: boolean;
                    retry_count: number;
                    error_message: string | null;
                    started_at: string | null;
                    completed_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    status?: StoryStatus;
                    category_id?: string | null;
                    location?: string | null;
                    moral_id?: string | null;
                    length?: StoryLength;
                    notify_on_complete?: boolean;
                    retry_count?: number;
                    error_message?: string | null;
                };
                Update: {
                    status?: StoryStatus;
                    category_id?: string | null;
                    location?: string | null;
                    moral_id?: string | null;
                    length?: StoryLength;
                    notify_on_complete?: boolean;
                    retry_count?: number;
                    error_message?: string | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                };
            };
            story_request_children: {
                Row: {
                    id: string;
                    story_request_id: string;
                    child_id: string;
                };
                Insert: {
                    id?: string;
                    story_request_id: string;
                    child_id: string;
                };
                Update: never;
            };
            story_request_characters: {
                Row: {
                    id: string;
                    story_request_id: string;
                    category_character_id: string | null;
                    side_character_id: string | null;
                };
                Insert: {
                    id?: string;
                    story_request_id: string;
                    category_character_id?: string | null;
                    side_character_id?: string | null;
                };
                Update: never;
            };
            stories: {
                Row: {
                    id: string;
                    user_id: string;
                    request_id: string | null;
                    title: string;
                    content: StoryContent;
                    reading_time_minutes: number | null;
                    is_favorite: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    request_id?: string | null;
                    title: string;
                    content: StoryContent;
                    reading_time_minutes?: number | null;
                    is_favorite?: boolean;
                };
                Update: {
                    title?: string;
                    content?: StoryContent;
                    reading_time_minutes?: number | null;
                    is_favorite?: boolean;
                };
            };
            story_scenes: {
                Row: {
                    id: string;
                    story_id: string;
                    scene_index: number;
                    image_prompt: string | null;
                    image_url: string | null;
                    video_url: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    story_id: string;
                    scene_index: number;
                    image_prompt?: string | null;
                    image_url?: string | null;
                    video_url?: string | null;
                };
                Update: {
                    image_prompt?: string | null;
                    image_url?: string | null;
                    video_url?: string | null;
                };
            };
            story_children: {
                Row: {
                    id: string;
                    story_id: string;
                    child_id: string;
                };
                Insert: {
                    id?: string;
                    story_id: string;
                    child_id: string;
                };
                Update: never;
            };
        };
    };
}

// Story Content Types
export interface StoryParagraph {
    text: string;
    scene_marker?: boolean;
    image_prompt?: string;
}

export interface StoryContent {
    story: StoryParagraph[];
    moral_summary: string;
}

// Convenience Types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Child = Database['public']['Tables']['children']['Row'];
export type ChildInterest = Database['public']['Tables']['child_interests']['Row'];
export type SideCharacter = Database['public']['Tables']['side_characters']['Row'];
export type StoryCategory = Database['public']['Tables']['story_categories']['Row'];
export type CategoryCharacter = Database['public']['Tables']['category_characters']['Row'];
export type Moral = Database['public']['Tables']['morals']['Row'];
export type StoryRequest = Database['public']['Tables']['story_requests']['Row'];
export type Story = Database['public']['Tables']['stories']['Row'];
export type StoryScene = Database['public']['Tables']['story_scenes']['Row'];

// Series Types
export type SeriesMode = 'fixed' | 'unlimited';
export type EndingType = 'normal' | 'cliffhanger' | 'final';

export interface Series {
    id: string;
    user_id: string;
    title: string | null;
    child_ids: string[];
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    location_text: string | null;
    chosen_character_ids: string[] | null;
    chosen_category_character_ids: string[] | null;
    mode: SeriesMode;
    planned_episodes: number | null;
    is_finished: boolean;
    default_moral_key: string | null;
    default_length: StoryLength;
    created_at: string;
    updated_at: string;
}

export interface SeriesEpisode {
    id: string;
    series_id: string;
    episode_number: number;
    moral_key: string;
    length_setting: StoryLength;
    is_final: boolean;
    recap_text: string | null;
    story_id: string | null;
    continuity_notes: string | null;
    created_at: string;
}

// Extended Story with series fields
export interface SeriesStory extends Story {
    series_id: string | null;
    episode_number: number | null;
    recap_text: string | null;
    ending_type: EndingType | null;
}

// Accessibility Types
export type AccessibilityIntensity = 'implicit' | 'normal' | 'active';

export interface ChildAccessibility {
    id: string;
    child_id: string;

    // Steuerung
    include_in_stories: boolean;
    intensity: AccessibilityIntensity;

    // Mobilität
    mobility_wheelchair: boolean;
    mobility_crutches: boolean;
    mobility_needs_breaks: boolean;

    // Sehen
    vision_blind: boolean;
    vision_low_vision: boolean;

    // Hören & Vorlesen
    hearing_hard_of_hearing: boolean;
    reading_need_calm_clear: boolean;
    no_sudden_loud_events: boolean;

    // Reizverarbeitung & Struktur
    no_scary: boolean;
    no_surprises: boolean;
    need_simple_language: boolean;
    prefer_routines: boolean;

    created_at: string;
    updated_at: string;
}

