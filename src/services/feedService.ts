/**
 * Servicio del Feed: publicaciones y comentarios en vivo (Supabase + Realtime).
 * Contenido y IDs se sanitizan/validan para evitar XSS e inyección.
 */

import { supabase } from './supabaseClient';
import {
  sanitizeContent,
  sanitizeEmail,
  sanitizeDisplayName,
  isValidPostId,
} from '@/utils/feedSanitize';

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

  /** Crear una publicación (contenido y usuario sanitizados) */
  async createPost(params: {
    user_email: string;
    user_display_name: string | null;
    content: string;
  }): Promise<FeedPost> {
    const content = sanitizeContent(params.content, MAX_CONTENT_LENGTH);
    if (!content) throw new Error('El contenido no puede estar vacío');
    const user_email = sanitizeEmail(params.user_email);
    if (!user_email) throw new Error('Usuario no válido');
    const user_display_name = sanitizeDisplayName(params.user_display_name);
    const { data, error } = await supabase
      .from(POSTS_TABLE)
      .insert({
        user_email,
        user_display_name,
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return data as FeedPost;
  },

  /** Obtener comentarios de un post (postId validado como UUID) */
  async getComments(postId: string): Promise<FeedComment[]> {
    if (!isValidPostId(postId)) return [];
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as FeedComment[];
  },

  /** Añadir comentario (contenido y IDs sanitizados) */
  async createComment(params: {
    post_id: string;
    user_email: string;
    user_display_name: string | null;
    content: string;
  }): Promise<FeedComment> {
    if (!isValidPostId(params.post_id)) throw new Error('Publicación no válida');
    const content = sanitizeContent(params.content, MAX_CONTENT_LENGTH);
    if (!content) throw new Error('El comentario no puede estar vacío');
    const user_email = sanitizeEmail(params.user_email);
    if (!user_email) throw new Error('Usuario no válido');
    const user_display_name = sanitizeDisplayName(params.user_display_name);
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .insert({
        post_id: params.post_id,
        user_email,
        user_display_name,
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

  /** Suscripción a comentarios de un post (postId validado para evitar inyección en filtro) */
  subscribeComments(
    postId: string,
    callback: (payload: { new?: FeedComment; old?: FeedComment; eventType: string }) => void
  ) {
    if (!isValidPostId(postId)) return () => {};
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
