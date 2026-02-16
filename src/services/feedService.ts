/**
 * Servicio del Feed: publicaciones y comentarios en vivo (Supabase + Realtime).
 */

import { supabase } from './supabaseClient';

export interface FeedPost {
  id: string;
  user_email: string;
  user_display_name: string | null;
  content: string;
  created_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_email: string;
  user_display_name: string | null;
  content: string;
  created_at: string;
}

const POSTS_TABLE = 'feed_posts';
const COMMENTS_TABLE = 'feed_comments';
const MAX_CONTENT_LENGTH = 2000;

export const feedService = {
  /** Obtener todas las publicaciones (más recientes primero) */
  async getPosts(): Promise<FeedPost[]> {
    const { data, error } = await supabase
      .from(POSTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FeedPost[];
  },

  /** Crear una publicación */
  async createPost(params: {
    user_email: string;
    user_display_name: string | null;
    content: string;
  }): Promise<FeedPost> {
    const content = params.content.trim().slice(0, MAX_CONTENT_LENGTH);
    if (!content) throw new Error('El contenido no puede estar vacío');
    const { data, error } = await supabase
      .from(POSTS_TABLE)
      .insert({
        user_email: params.user_email,
        user_display_name: params.user_display_name ?? null,
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return data as FeedPost;
  },

  /** Obtener comentarios de un post */
  async getComments(postId: string): Promise<FeedComment[]> {
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as FeedComment[];
  },

  /** Añadir comentario (chat en vivo) */
  async createComment(params: {
    post_id: string;
    user_email: string;
    user_display_name: string | null;
    content: string;
  }): Promise<FeedComment> {
    const content = params.content.trim().slice(0, MAX_CONTENT_LENGTH);
    if (!content) throw new Error('El comentario no puede estar vacío');
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .insert({
        post_id: params.post_id,
        user_email: params.user_email,
        user_display_name: params.user_display_name ?? null,
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return data as FeedComment;
  },

  /** Suscripción a cambios en publicaciones (Realtime) */
  subscribePosts(callback: (payload: { new?: FeedPost; old?: FeedPost; eventType: string }) => void) {
    const channel = supabase
      .channel('feed_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: POSTS_TABLE },
        (payload) => {
          callback({
            new: payload.new as FeedPost | undefined,
            old: payload.old as FeedPost | undefined,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  /** Suscripción a comentarios de un post (chat en vivo) */
  subscribeComments(
    postId: string,
    callback: (payload: { new?: FeedComment; old?: FeedComment; eventType: string }) => void
  ) {
    const channel = supabase
      .channel(`feed_comments_${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: COMMENTS_TABLE, filter: `post_id=eq.${postId}` },
        (payload) => {
          callback({
            new: payload.new as FeedComment | undefined,
            old: payload.old as FeedComment | undefined,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  MAX_CONTENT_LENGTH,
};
