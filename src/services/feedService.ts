/**
 * Servicio del Feed: publicaciones y comentarios en vivo (Supabase + Realtime).
 * Contenido y IDs se sanitizan/validan para evitar XSS e inyección.
 */

import { supabase } from './supabaseClient';
import {
  sanitizeContent,
  sanitizeEmail,
  sanitizeDisplayName,
  sanitizeTopic,
  isValidPostId,
  type FeedTopic,
} from '@/utils/feedSanitize';

export type { FeedTopic };
export const FEED_TOPICS = ['general', 'comida', 'seguridad', 'libros', 'fiestas'] as const;

export interface FeedPost {
  id: string;
  user_email: string;
  user_display_name: string | null;
  content: string;
  created_at: string;
  topic: string;
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
const REACTIONS_TABLE = 'feed_post_reactions';
const MAX_CONTENT_LENGTH = 2000;

export interface ReactionCounts {
  like: number;
  dislike: number;
}

export const feedService = {
  /** Obtener publicaciones (más recientes primero); opcionalmente filtrar por tema */
  async getPosts(topic?: FeedTopic | null): Promise<FeedPost[]> {
    let q = supabase.from(POSTS_TABLE).select('*').order('created_at', { ascending: false });
    if (topic && topic !== 'general') {
      q = q.eq('topic', topic);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as FeedPost[];
  },

  /** Crear una publicación (contenido, usuario y tema sanitizados) */
  async createPost(params: {
    user_email: string;
    user_display_name: string | null;
    content: string;
    topic?: string | null;
  }): Promise<FeedPost> {
    const content = sanitizeContent(params.content, MAX_CONTENT_LENGTH);
    if (!content) throw new Error('El contenido no puede estar vacío');
    const user_email = sanitizeEmail(params.user_email);
    if (!user_email) throw new Error('Usuario no válido');
    const user_display_name = sanitizeDisplayName(params.user_display_name);
    const topic = sanitizeTopic(params.topic ?? 'general');
    const { data, error } = await supabase
      .from(POSTS_TABLE)
      .insert({
        user_email,
        user_display_name,
        content,
        topic,
      })
      .select()
      .single();
    if (error) throw error;
    return data as FeedPost;
  },

  /** Obtener conteos de likes/dislikes por post */
  async getReactionCounts(postIds: string[]): Promise<Record<string, ReactionCounts>> {
    if (postIds.length === 0) return {};
    const validIds = postIds.filter((id) => isValidPostId(id));
    if (validIds.length === 0) return {};
    const { data, error } = await supabase
      .from(REACTIONS_TABLE)
      .select('post_id, reaction')
      .in('post_id', validIds);
    if (error) throw error;
    const result: Record<string, ReactionCounts> = {};
    validIds.forEach((id) => {
      result[id] = { like: 0, dislike: 0 };
    });
    (data ?? []).forEach((row: { post_id: string; reaction: string }) => {
      if (result[row.post_id]) {
        if (row.reaction === 'like') result[row.post_id].like += 1;
        if (row.reaction === 'dislike') result[row.post_id].dislike += 1;
      }
    });
    return result;
  },

  /** Reacciones del usuario actual por post */
  async getUserReactions(postIds: string[], userEmail: string): Promise<Record<string, 'like' | 'dislike'>> {
    if (postIds.length === 0 || !userEmail) return {};
    const validIds = postIds.filter((id) => isValidPostId(id));
    if (validIds.length === 0) return {};
    const email = sanitizeEmail(userEmail);
    if (!email) return {};
    const { data, error } = await supabase
      .from(REACTIONS_TABLE)
      .select('post_id, reaction')
      .in('post_id', validIds)
      .eq('user_email', email);
    if (error) throw error;
    const result: Record<string, 'like' | 'dislike'> = {};
    (data ?? []).forEach((row: { post_id: string; reaction: string }) => {
      if (row.reaction === 'like' || row.reaction === 'dislike') result[row.post_id] = row.reaction;
    });
    return result;
  },

  /** Poner o quitar like/dislike (toggle: si ya tiene esa reacción, se quita) */
  async setReaction(
    postId: string,
    userEmail: string,
    reaction: 'like' | 'dislike'
  ): Promise<{ action: 'set' | 'removed' }> {
    if (!isValidPostId(postId)) throw new Error('Publicación no válida');
    const email = sanitizeEmail(userEmail);
    if (!email) throw new Error('Usuario no válido');
    const { data: existing } = await supabase
      .from(REACTIONS_TABLE)
      .select('id, reaction')
      .eq('post_id', postId)
      .eq('user_email', email)
      .maybeSingle();
    if (existing && (existing as { reaction: string }).reaction === reaction) {
      await supabase.from(REACTIONS_TABLE).delete().eq('post_id', postId).eq('user_email', email);
      return { action: 'removed' };
    }
    await supabase.from(REACTIONS_TABLE).upsert(
      { post_id: postId, user_email: email, reaction },
      { onConflict: 'post_id,user_email' }
    );
    return { action: 'set' };
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
