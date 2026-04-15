import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Profile,
  ProfileUpdate,
  WallPost,
  WallPostInsert,
  WallPostUpdate,
  WallComment,
  WallCommentInsert,
  Event,
  EventInsert,
  EventUpdate,
  EventRsvp,
  RsvpStatus,
  Conversation,
  Message,
  MessageInsert,
  MarketplaceListing,
  MarketplaceListingInsert,
  MarketplaceListingUpdate,
  Notification,
  NotificationPreferences,
  PushToken,
  UserReward,
  Report,
  PaginatedResponse,
  ApiResult,
  PostType,
  PostVisibility,
  ListingCategory,
  ListingStatus,
  UserRole,
  ReportStatus,
} from '../types';

// ============================================================================
// Helpers
// ============================================================================

function ok<T>(data: T): ApiResult<T> {
  return { data, error: null };
}

function err<T>(message: string): ApiResult<T> {
  return { data: null, error: message };
}

function paginate<T>(
  data: T[],
  count: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    data,
    count,
    page,
    pageSize,
    hasMore: page * pageSize < count,
  };
}

const PROFILE_SELECT = 'id, username, display_name, avatar_url, role, is_verified, unit_number, building';

// ============================================================================
// Profile API
// ============================================================================

export const profileApi = {
  async getProfile(supabase: SupabaseClient, userId: string): Promise<ApiResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return err(error.message);
    return ok(data as Profile);
  },

  async updateProfile(
    supabase: SupabaseClient,
    userId: string,
    updates: ProfileUpdate,
  ): Promise<ApiResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as Profile);
  },

  async searchProfiles(
    supabase: SupabaseClient,
    query: string,
    limit = 20,
  ): Promise<ApiResult<Profile[]>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit);
    if (error) return err(error.message);
    return ok((data ?? []) as Profile[]);
  },
};

// ============================================================================
// Wall API
// ============================================================================

export const wallApi = {
  async getPosts(
    supabase: SupabaseClient,
    options: {
      page: number;
      pageSize: number;
      type?: PostType;
      visibility?: PostVisibility;
    },
  ): Promise<ApiResult<PaginatedResponse<WallPost>>> {
    const { page, pageSize, type, visibility } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('wall_posts')
      .select(`*, author:profiles!author_id(${PROFILE_SELECT})`, { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) query = query.eq('type', type);
    if (visibility) query = query.eq('visibility', visibility);

    const { data, error, count } = await query;
    if (error) return err(error.message);
    return ok(paginate((data ?? []) as WallPost[], count ?? 0, page, pageSize));
  },

  async getPost(supabase: SupabaseClient, postId: string): Promise<ApiResult<WallPost>> {
    const { data, error } = await supabase
      .from('wall_posts')
      .select(`*, author:profiles!author_id(${PROFILE_SELECT})`)
      .eq('id', postId)
      .single();
    if (error) return err(error.message);
    return ok(data as WallPost);
  },

  async createPost(
    supabase: SupabaseClient,
    post: WallPostInsert,
  ): Promise<ApiResult<WallPost>> {
    const { data, error } = await supabase
      .from('wall_posts')
      .insert(post)
      .select(`*, author:profiles!author_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as WallPost);
  },

  async updatePost(
    supabase: SupabaseClient,
    postId: string,
    updates: WallPostUpdate,
  ): Promise<ApiResult<WallPost>> {
    const { data, error } = await supabase
      .from('wall_posts')
      .update(updates)
      .eq('id', postId)
      .select(`*, author:profiles!author_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as WallPost);
  },

  async deletePost(supabase: SupabaseClient, postId: string): Promise<ApiResult<null>> {
    const { error } = await supabase.from('wall_posts').delete().eq('id', postId);
    if (error) return err(error.message);
    return ok(null);
  },

  async toggleLike(
    supabase: SupabaseClient,
    postId: string,
    userId: string,
  ): Promise<ApiResult<{ liked: boolean }>> {
    // Check if already liked
    const { data: existing } = await supabase
      .from('wall_likes')
      .select('user_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('wall_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) return err(error.message);
      return ok({ liked: false });
    }

    const { error } = await supabase
      .from('wall_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) return err(error.message);
    return ok({ liked: true });
  },

  async getComments(
    supabase: SupabaseClient,
    postId: string,
  ): Promise<ApiResult<WallComment[]>> {
    const { data, error } = await supabase
      .from('wall_comments')
      .select(`*, author:profiles!author_id(${PROFILE_SELECT})`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) return err(error.message);
    return ok((data ?? []) as WallComment[]);
  },

  async addComment(
    supabase: SupabaseClient,
    comment: WallCommentInsert,
  ): Promise<ApiResult<WallComment>> {
    const { data, error } = await supabase
      .from('wall_comments')
      .insert(comment)
      .select(`*, author:profiles!author_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as WallComment);
  },
};

// ============================================================================
// Events API
// ============================================================================

export const eventsApi = {
  async getEvents(
    supabase: SupabaseClient,
    options: { upcoming?: boolean; month?: number; year?: number } = {},
  ): Promise<ApiResult<Event[]>> {
    let query = supabase
      .from('events')
      .select(`*, organizer:profiles!organizer_id(${PROFILE_SELECT})`)
      .order('start_time', { ascending: true });

    if (options.upcoming) {
      query = query.gte('start_time', new Date().toISOString());
    }

    if (options.month !== undefined && options.year !== undefined) {
      const start = new Date(options.year, options.month - 1, 1).toISOString();
      const end = new Date(options.year, options.month, 0, 23, 59, 59).toISOString();
      query = query.gte('start_time', start).lte('start_time', end);
    }

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok((data ?? []) as Event[]);
  },

  async getEvent(supabase: SupabaseClient, eventId: string): Promise<ApiResult<Event>> {
    const { data, error } = await supabase
      .from('events')
      .select(`*, organizer:profiles!organizer_id(${PROFILE_SELECT})`)
      .eq('id', eventId)
      .single();
    if (error) return err(error.message);
    return ok(data as Event);
  },

  async createEvent(
    supabase: SupabaseClient,
    event: EventInsert,
  ): Promise<ApiResult<Event>> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select(`*, organizer:profiles!organizer_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as Event);
  },

  async updateEvent(
    supabase: SupabaseClient,
    eventId: string,
    updates: EventUpdate,
  ): Promise<ApiResult<Event>> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select(`*, organizer:profiles!organizer_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as Event);
  },

  async updateRsvp(
    supabase: SupabaseClient,
    eventId: string,
    userId: string,
    status: RsvpStatus,
  ): Promise<ApiResult<EventRsvp>> {
    const { data, error } = await supabase
      .from('event_rsvps')
      .upsert(
        { event_id: eventId, user_id: userId, status },
        { onConflict: 'event_id,user_id' },
      )
      .select(`*, user:profiles!user_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as EventRsvp);
  },

  async getAttendees(
    supabase: SupabaseClient,
    eventId: string,
  ): Promise<ApiResult<EventRsvp[]>> {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select(`*, user:profiles!user_id(${PROFILE_SELECT})`)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (error) return err(error.message);
    return ok((data ?? []) as EventRsvp[]);
  },
};

// ============================================================================
// Messaging API
// ============================================================================

export const messagingApi = {
  async getConversations(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<ApiResult<Conversation[]>> {
    // Get conversation IDs user participates in
    const { data: participantRows, error: pErr } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);
    if (pErr) return err(pErr.message);

    const ids = (participantRows ?? []).map((r: { conversation_id: string }) => r.conversation_id);
    if (ids.length === 0) return ok([]);

    const { data, error } = await supabase
      .from('conversations')
      .select(`*, participants:conversation_participants(*, user:profiles!user_id(${PROFILE_SELECT}))`)
      .in('id', ids)
      .order('updated_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as Conversation[]);
  },

  async getMessages(
    supabase: SupabaseClient,
    conversationId: string,
    options: { limit: number; before?: string } = { limit: 50 },
  ): Promise<ApiResult<Message[]>> {
    let query = supabase
      .from('messages')
      .select(`*, sender:profiles!sender_id(${PROFILE_SELECT})`)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(options.limit);

    if (options.before) {
      query = query.lt('created_at', options.before);
    }

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok((data ?? []) as Message[]);
  },

  async sendMessage(
    supabase: SupabaseClient,
    message: MessageInsert,
  ): Promise<ApiResult<Message>> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select(`*, sender:profiles!sender_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);

    // Update conversation updated_at to bubble it to the top
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    return ok(data as Message);
  },

  async createConversation(
    supabase: SupabaseClient,
    data: { participant_ids: string[]; is_group?: boolean; group_name?: string; created_by: string },
  ): Promise<ApiResult<Conversation>> {
    const { data: conv, error: cErr } = await supabase
      .from('conversations')
      .insert({
        is_group: data.is_group ?? false,
        group_name: data.group_name ?? null,
        created_by: data.created_by,
      })
      .select('*')
      .single();
    if (cErr) return err(cErr.message);

    const participants = data.participant_ids.map((uid) => ({
      conversation_id: (conv as Conversation).id,
      user_id: uid,
    }));

    const { error: pErr } = await supabase
      .from('conversation_participants')
      .insert(participants);
    if (pErr) return err(pErr.message);

    return ok(conv as Conversation);
  },

  async markAsRead(
    supabase: SupabaseClient,
    conversationId: string,
    userId: string,
  ): Promise<ApiResult<null>> {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) return err(error.message);
    return ok(null);
  },
};

// ============================================================================
// Marketplace API
// ============================================================================

export const marketplaceApi = {
  async getListings(
    supabase: SupabaseClient,
    options: {
      category?: ListingCategory;
      status?: ListingStatus;
      search?: string;
      page: number;
      pageSize: number;
    },
  ): Promise<ApiResult<PaginatedResponse<MarketplaceListing>>> {
    const { page, pageSize, category, status, search } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('marketplace_listings')
      .select(`*, seller:profiles!seller_id(${PROFILE_SELECT})`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) return err(error.message);
    return ok(paginate((data ?? []) as MarketplaceListing[], count ?? 0, page, pageSize));
  },

  async getListing(
    supabase: SupabaseClient,
    listingId: string,
  ): Promise<ApiResult<MarketplaceListing>> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`*, seller:profiles!seller_id(${PROFILE_SELECT})`)
      .eq('id', listingId)
      .single();
    if (error) return err(error.message);
    return ok(data as MarketplaceListing);
  },

  async createListing(
    supabase: SupabaseClient,
    listing: MarketplaceListingInsert,
  ): Promise<ApiResult<MarketplaceListing>> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert(listing)
      .select(`*, seller:profiles!seller_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as MarketplaceListing);
  },

  async updateListing(
    supabase: SupabaseClient,
    listingId: string,
    updates: MarketplaceListingUpdate,
  ): Promise<ApiResult<MarketplaceListing>> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .update(updates)
      .eq('id', listingId)
      .select(`*, seller:profiles!seller_id(${PROFILE_SELECT})`)
      .single();
    if (error) return err(error.message);
    return ok(data as MarketplaceListing);
  },

  async deleteListing(
    supabase: SupabaseClient,
    listingId: string,
  ): Promise<ApiResult<null>> {
    const { error } = await supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', listingId);
    if (error) return err(error.message);
    return ok(null);
  },
};

// ============================================================================
// Notifications API
// ============================================================================

export const notificationsApi = {
  async getNotifications(
    supabase: SupabaseClient,
    userId: string,
    options: { unreadOnly?: boolean; limit: number } = { limit: 50 },
  ): Promise<ApiResult<Notification[]>> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(options.limit);

    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok((data ?? []) as Notification[]);
  },

  async markAsRead(
    supabase: SupabaseClient,
    notificationId: string,
  ): Promise<ApiResult<null>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) return err(error.message);
    return ok(null);
  },

  async markAllAsRead(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<ApiResult<null>> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return err(error.message);
    return ok(null);
  },

  async getUnreadCount(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<ApiResult<number>> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return err(error.message);
    return ok(count ?? 0);
  },

  async registerPushToken(
    supabase: SupabaseClient,
    data: { user_id: string; token: string; platform: string },
  ): Promise<ApiResult<PushToken>> {
    const { data: token, error } = await supabase
      .from('push_tokens')
      .upsert(data, { onConflict: 'user_id,token' })
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(token as PushToken);
  },

  async updatePreferences(
    supabase: SupabaseClient,
    userId: string,
    prefs: NotificationPreferences,
  ): Promise<ApiResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ notification_preferences: prefs })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as Profile);
  },
};

// ============================================================================
// Rewards API
// ============================================================================

export const rewardsApi = {
  async getLeaderboard(
    supabase: SupabaseClient,
    limit = 20,
  ): Promise<ApiResult<Profile[]>> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT + ', points')
      .order('points', { ascending: false })
      .limit(limit);
    if (error) return err(error.message);
    return ok((data ?? []) as unknown as Profile[]);
  },

  async getUserRewards(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<ApiResult<UserReward[]>> {
    const { data, error } = await supabase
      .from('user_rewards')
      .select('*, action:reward_actions!action_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return err(error.message);
    return ok((data ?? []) as UserReward[]);
  },

  async awardPoints(
    supabase: SupabaseClient,
    data: { user_id: string; action_name: string },
  ): Promise<ApiResult<UserReward>> {
    // Look up the action
    const { data: action, error: aErr } = await supabase
      .from('reward_actions')
      .select('*')
      .eq('name', data.action_name)
      .single();
    if (aErr) return err(aErr.message);

    // Insert user_reward
    const { data: reward, error: rErr } = await supabase
      .from('user_rewards')
      .insert({
        user_id: data.user_id,
        action_id: action.id,
        points_earned: action.points,
      })
      .select('*, action:reward_actions!action_id(*)')
      .single();
    if (rErr) return err(rErr.message);

    // Increment profile points
    await supabase.rpc('increment_points', {
      user_id: data.user_id,
      amount: action.points,
    }).then(async (res) => {
      // Fallback: if RPC doesn't exist, do a manual update
      if (res.error) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', data.user_id)
          .single();
        if (profile) {
          await supabase
            .from('profiles')
            .update({ points: (profile.points ?? 0) + action.points })
            .eq('id', data.user_id);
        }
      }
    });

    return ok(reward as UserReward);
  },
};

// ============================================================================
// Admin API
// ============================================================================

// Re-export feature APIs from separate files
export { groupsApi } from './groupsApi';
export { packagesApi } from './packagesApi';
export { guestPassesApi } from './guestPassesApi';

// ============================================================================
// Admin API
// ============================================================================

export const adminApi = {
  async getUsers(
    supabase: SupabaseClient,
    options: { role?: UserRole; search?: string } = {},
  ): Promise<ApiResult<Profile[]>> {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.role) query = query.eq('role', options.role);
    if (options.search) {
      query = query.or(
        `username.ilike.%${options.search}%,display_name.ilike.%${options.search}%,email.ilike.%${options.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok((data ?? []) as Profile[]);
  },

  async updateUserRole(
    supabase: SupabaseClient,
    userId: string,
    role: UserRole,
  ): Promise<ApiResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as Profile);
  },

  async verifyUser(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<ApiResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) return err(error.message);
    return ok(data as Profile);
  },

  async getReports(
    supabase: SupabaseClient,
    options: { status?: ReportStatus } = {},
  ): Promise<ApiResult<Report[]>> {
    let query = supabase
      .from('reports')
      .select(
        `*, reporter:profiles!reporter_id(${PROFILE_SELECT}), reported_user:profiles!reported_user_id(${PROFILE_SELECT})`,
      )
      .order('created_at', { ascending: false });

    if (options.status) query = query.eq('status', options.status);

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok((data ?? []) as Report[]);
  },

  async resolveReport(
    supabase: SupabaseClient,
    reportId: string,
    resolution: { status: ReportStatus; admin_notes: string },
  ): Promise<ApiResult<Report>> {
    const { data, error } = await supabase
      .from('reports')
      .update(resolution)
      .eq('id', reportId)
      .select(
        `*, reporter:profiles!reporter_id(${PROFILE_SELECT}), reported_user:profiles!reported_user_id(${PROFILE_SELECT})`,
      )
      .single();
    if (error) return err(error.message);
    return ok(data as Report);
  },
};

// Re-export community API
export {
  emergencyContactsApi,
  checklistApi,
  communitySettingsApi,
  petProfilesApi,
  photoAlbumsApi,
  announcementsApi,
} from './communityApi';

export type {
  EmergencyContact,
  ChecklistTemplate,
  ChecklistTemplateItem,
  UserChecklist,
  CommunitySettingRow,
  PetProfile,
  PetProfileInsert,
  PetProfileUpdate,
  PhotoAlbum,
  AlbumPhoto,
  Announcement,
} from './communityApi';
