import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiResult } from '../types';

// ============================================================================
// Helpers
// ============================================================================

function ok<T>(data: T): ApiResult<T> {
  return { data, error: null };
}

function err<T>(message: string): ApiResult<T> {
  return { data: null, error: message };
}

// ============================================================================
// Types
// ============================================================================

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  category: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  type: 'move_in' | 'move_out';
  items: ChecklistTemplateItem[];
  created_at: string;
}

export interface ChecklistTemplateItem {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

export interface UserChecklist {
  id: string;
  user_id: string;
  template_id: string;
  completed_items: string[];
  started_at: string;
  completed_at: string | null;
  template?: ChecklistTemplate;
}

export interface CommunitySettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface PetProfile {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  description: string | null;
  photo_url: string | null;
  is_lost: boolean;
  last_seen_location: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
  owner?: { id: string; display_name: string; avatar_url: string | null; unit_number: string | null };
}

export type PetProfileInsert = Omit<PetProfile, 'id' | 'created_at' | 'updated_at' | 'owner'>;
export type PetProfileUpdate = Partial<Omit<PetProfile, 'id' | 'created_at' | 'updated_at' | 'owner' | 'owner_id'>>;

export interface PhotoAlbum {
  id: string;
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  created_by: string;
  photo_count: number;
  created_at: string;
  updated_at: string;
  creator?: { id: string; display_name: string; avatar_url: string | null };
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  photo_url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
  uploader?: { id: string; display_name: string; avatar_url: string | null };
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'urgent' | 'normal' | 'info';
  is_pinned: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: { id: string; display_name: string; avatar_url: string | null; role: string };
}

// ============================================================================
// Emergency Contacts API
// ============================================================================

export const emergencyContactsApi = {
  async getAll(supabase: SupabaseClient): Promise<ApiResult<EmergencyContact[]>> {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) return err(error.message);
    return ok((data ?? []) as EmergencyContact[]);
  },

  async create(
    supabase: SupabaseClient,
    contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ApiResult<EmergencyContact>> {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert(contact)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as EmergencyContact);
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<ApiResult<EmergencyContact>> {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as EmergencyContact);
  },

  async delete(supabase: SupabaseClient, id: string): Promise<ApiResult<null>> {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);
    if (error) return err(error.message);
    return ok(null);
  },
};

// ============================================================================
// Checklist API
// ============================================================================

export const checklistApi = {
  async getTemplates(supabase: SupabaseClient): Promise<ApiResult<ChecklistTemplate[]>> {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('type', { ascending: true });
    if (error) return err(error.message);
    return ok((data ?? []) as ChecklistTemplate[]);
  },

  async getUserChecklist(
    supabase: SupabaseClient,
    userId: string,
    templateId: string,
  ): Promise<ApiResult<UserChecklist | null>> {
    const { data, error } = await supabase
      .from('user_checklists')
      .select('*, template:checklist_templates(*)')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .maybeSingle();
    if (error) return err(error.message);
    return ok(data as UserChecklist | null);
  },

  async createUserChecklist(
    supabase: SupabaseClient,
    userId: string,
    templateId: string,
  ): Promise<ApiResult<UserChecklist>> {
    const { data, error } = await supabase
      .from('user_checklists')
      .insert({ user_id: userId, template_id: templateId, completed_items: [] })
      .select('*, template:checklist_templates(*)')
      .single();
    if (error) return err(error.message);
    return ok(data as UserChecklist);
  },

  async toggleItem(
    supabase: SupabaseClient,
    checklistId: string,
    completedItems: string[],
  ): Promise<ApiResult<UserChecklist>> {
    const { data, error } = await supabase
      .from('user_checklists')
      .update({
        completed_items: completedItems,
        completed_at: null,
      })
      .eq('id', checklistId)
      .select('*, template:checklist_templates(*)')
      .single();
    if (error) return err(error.message);
    return ok(data as UserChecklist);
  },

  async getProgress(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<ApiResult<UserChecklist[]>> {
    const { data, error } = await supabase
      .from('user_checklists')
      .select('*, template:checklist_templates(*)')
      .eq('user_id', userId);
    if (error) return err(error.message);
    return ok((data ?? []) as UserChecklist[]);
  },
};

// ============================================================================
// Community Settings API
// ============================================================================

export const communitySettingsApi = {
  async get(supabase: SupabaseClient, key: string): Promise<ApiResult<CommunitySettingRow | null>> {
    const { data, error } = await supabase
      .from('community_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();
    if (error) return err(error.message);
    return ok(data as CommunitySettingRow | null);
  },

  async update(
    supabase: SupabaseClient,
    key: string,
    value: unknown,
  ): Promise<ApiResult<CommunitySettingRow>> {
    const { data, error } = await supabase
      .from('community_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as CommunitySettingRow);
  },
};

// ============================================================================
// Pet Profiles API
// ============================================================================

const PET_OWNER_SELECT = 'id, display_name, avatar_url, unit_number';

export const petProfilesApi = {
  async getByOwner(supabase: SupabaseClient, ownerId: string): Promise<ApiResult<PetProfile[]>> {
    const { data, error } = await supabase
      .from('pet_profiles')
      .select(`*, owner:profiles!owner_id(${PET_OWNER_SELECT})`)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as PetProfile[]);
  },

  async getAll(supabase: SupabaseClient): Promise<ApiResult<PetProfile[]>> {
    const { data, error } = await supabase
      .from('pet_profiles')
      .select(`*, owner:profiles!owner_id(${PET_OWNER_SELECT})`)
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as PetProfile[]);
  },

  async getById(supabase: SupabaseClient, id: string): Promise<ApiResult<PetProfile>> {
    const { data, error } = await supabase
      .from('pet_profiles')
      .select(`*, owner:profiles!owner_id(${PET_OWNER_SELECT})`)
      .eq('id', id)
      .single();
    if (error) return err(error.message);
    return ok(data as PetProfile);
  },

  async create(supabase: SupabaseClient, pet: PetProfileInsert): Promise<ApiResult<PetProfile>> {
    const { data, error } = await supabase
      .from('pet_profiles')
      .insert(pet)
      .select(`*, owner:profiles!owner_id(${PET_OWNER_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as PetProfile);
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: PetProfileUpdate,
  ): Promise<ApiResult<PetProfile>> {
    const { data, error } = await supabase
      .from('pet_profiles')
      .update(updates)
      .eq('id', id)
      .select(`*, owner:profiles!owner_id(${PET_OWNER_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as PetProfile);
  },

  async delete(supabase: SupabaseClient, id: string): Promise<ApiResult<null>> {
    const { error } = await supabase.from('pet_profiles').delete().eq('id', id);
    if (error) return err(error.message);
    return ok(null);
  },

  async getLost(supabase: SupabaseClient): Promise<ApiResult<PetProfile[]>> {
    const { data, error } = await supabase
      .from('pet_profiles')
      .select(`*, owner:profiles!owner_id(${PET_OWNER_SELECT})`)
      .eq('is_lost', true)
      .order('last_seen_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as PetProfile[]);
  },
};

// ============================================================================
// Photo Albums API
// ============================================================================

const CREATOR_SELECT = 'id, display_name, avatar_url';

export const photoAlbumsApi = {
  async getAll(supabase: SupabaseClient): Promise<ApiResult<PhotoAlbum[]>> {
    const { data, error } = await supabase
      .from('photo_albums')
      .select(`*, creator:profiles!created_by(${CREATOR_SELECT})`)
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as PhotoAlbum[]);
  },

  async getById(supabase: SupabaseClient, id: string): Promise<ApiResult<PhotoAlbum>> {
    const { data, error } = await supabase
      .from('photo_albums')
      .select(`*, creator:profiles!created_by(${CREATOR_SELECT})`)
      .eq('id', id)
      .single();
    if (error) return err(error.message);
    return ok(data as PhotoAlbum);
  },

  async create(
    supabase: SupabaseClient,
    album: { title: string; description?: string; cover_photo_url?: string; created_by: string },
  ): Promise<ApiResult<PhotoAlbum>> {
    const { data, error } = await supabase
      .from('photo_albums')
      .insert({ ...album, photo_count: 0 })
      .select(`*, creator:profiles!created_by(${CREATOR_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as PhotoAlbum);
  },

  async addPhoto(
    supabase: SupabaseClient,
    photo: { album_id: string; photo_url: string; caption?: string; uploaded_by: string },
  ): Promise<ApiResult<AlbumPhoto>> {
    const { data, error } = await supabase
      .from('album_photos')
      .insert(photo)
      .select(`*, uploader:profiles!uploaded_by(${CREATOR_SELECT})`)
      .single();
    if (error) return err(error.message);

    // Increment photo count
    await supabase.rpc('increment_photo_count', { album_id: photo.album_id }).catch(() => {
      // fallback: manual increment
      supabase
        .from('photo_albums')
        .update({ photo_count: data ? 1 : 0 })
        .eq('id', photo.album_id);
    });

    return ok(data as AlbumPhoto);
  },

  async getPhotos(supabase: SupabaseClient, albumId: string): Promise<ApiResult<AlbumPhoto[]>> {
    const { data, error } = await supabase
      .from('album_photos')
      .select(`*, uploader:profiles!uploaded_by(${CREATOR_SELECT})`)
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as AlbumPhoto[]);
  },
};

// ============================================================================
// Announcements API (for bulletin board)
// ============================================================================

const AUTHOR_SELECT = 'id, display_name, avatar_url, role';

export const announcementsApi = {
  async getAll(supabase: SupabaseClient): Promise<ApiResult<Announcement[]>> {
    const { data, error } = await supabase
      .from('announcements')
      .select(`*, author:profiles!author_id(${AUTHOR_SELECT})`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as Announcement[]);
  },

  async create(
    supabase: SupabaseClient,
    announcement: { title: string; body: string; priority?: string; is_pinned?: boolean; author_id: string },
  ): Promise<ApiResult<Announcement>> {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcement)
      .select(`*, author:profiles!author_id(${AUTHOR_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as Announcement);
  },
};
