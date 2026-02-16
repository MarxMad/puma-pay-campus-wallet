import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Send, Loader2, ChevronDown, ChevronUp, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
  feedService,
  FEED_TOPICS,
  type FeedPost,
  type FeedComment,
  type FeedTopic,
  type ReactionCounts,
} from '@/services/feedService';
import { toast } from 'sonner';
import { sanitizeContent } from '@/utils/feedSanitize';
import { rateLimit } from '@/utils/rateLimit';

const TOPIC_LABELS: Record<FeedTopic, string> = {
  general: 'Todos',
  comida: 'Comida',
  seguridad: 'Seguridad',
  libros: 'Libros',
  fiestas: 'Fiestas',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString();
}

/** Muestra texto del feed de forma segura (sin HTML, escapado por React) */
function SafeText({ text }: { text: string }) {
  const safe = sanitizeContent(text, feedService.MAX_CONTENT_LENGTH);
  return <span className="whitespace-pre-wrap break-words">{safe}</span>;
}

export const Feed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTopic, setNewPostTopic] = useState<FeedTopic>('general');
  const [selectedTopic, setSelectedTopic] = useState<FeedTopic>('general');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingCommentFor, setSendingCommentFor] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionCounts>>({});
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);

  const userEmail = user?.email ?? '';
  const userDisplayName = user?.name ?? user?.email ?? 'Anónimo';

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await feedService.getPosts(selectedTopic);
      setPosts(list);
      const ids = list.map((p) => p.id);
      if (ids.length > 0) {
        const [counts, reactions] = await Promise.all([
          feedService.getReactionCounts(ids),
          userEmail ? feedService.getUserReactions(ids, userEmail) : Promise.resolve({}),
        ]);
        setReactionCounts(counts);
        setUserReactions(reactions);
      } else {
        setReactionCounts({});
        setUserReactions({});
      }
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar las publicaciones');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, userEmail]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const unsub = feedService.subscribePosts((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const post = payload.new as FeedPost;
        const topic = post.topic ?? 'general';
        if (selectedTopic === 'general' || selectedTopic === topic) {
          setPosts((prev) => [post, ...prev]);
          setReactionCounts((prev) => ({ ...prev, [post.id]: { like: 0, dislike: 0 } }));
        }
      }
      if (payload.eventType === 'DELETE' && payload.old) {
        setPosts((prev) => prev.filter((p) => p.id !== payload.old!.id));
      }
    });
    return unsub;
  }, [selectedTopic]);

  const loadComments = useCallback(async (postId: string) => {
    try {
      const list = await feedService.getComments(postId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: list }));
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar los comentarios');
    }
  }, []);

  useEffect(() => {
    if (!expandedPostId) return;
    loadComments(expandedPostId);
  }, [expandedPostId, loadComments]);

  useEffect(() => {
    if (!expandedPostId) return;
    const unsub = feedService.subscribeComments(expandedPostId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setCommentsByPost((prev) => ({
          ...prev,
          [expandedPostId]: [...(prev[expandedPostId] ?? []), payload.new!],
        }));
      }
      if (payload.eventType === 'DELETE' && payload.old) {
        setCommentsByPost((prev) => ({
          ...prev,
          [expandedPostId]: (prev[expandedPostId] ?? []).filter((c) => c.id !== payload.old!.id),
        }));
      }
    });
    return unsub;
  }, [expandedPostId]);

  const handleCreatePost = async () => {
    if (!userEmail.trim()) {
      toast.error('Inicia sesión para publicar');
      return;
    }
    const content = newPostContent.trim();
    if (!content) {
      toast.error('Escribe algo para publicar');
      return;
    }
    const rl = rateLimit.post();
    if (!rl.allowed && rl.retryAfterMs != null) {
      toast.error(`Espera ${Math.ceil(rl.retryAfterMs / 1000)} s antes de publicar de nuevo`);
      return;
    }
    setPosting(true);
    try {
      await feedService.createPost({
        user_email: userEmail,
        user_display_name: userDisplayName,
        content,
        topic: newPostTopic,
      });
      setNewPostContent('');
      toast.success('Publicado');
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al publicar');
    } finally {
      setPosting(false);
    }
  };

  const handleSetReaction = async (postId: string, reaction: 'like' | 'dislike') => {
    if (!userEmail.trim()) {
      toast.error('Inicia sesión para reaccionar');
      return;
    }
    setReactionLoading(postId);
    try {
      const current = userReactions[postId];
      const { action } = await feedService.setReaction(postId, userEmail, reaction);
      const counts = { ...reactionCounts[postId], like: reactionCounts[postId]?.like ?? 0, dislike: reactionCounts[postId]?.dislike ?? 0 };
      if (action === 'removed') {
        counts[reaction] = Math.max(0, counts[reaction] - 1);
        setUserReactions((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      } else {
        const other = reaction === 'like' ? 'dislike' : 'like';
        if (current === other) counts[other] = Math.max(0, counts[other] - 1);
        counts[reaction] = (counts[reaction] ?? 0) + 1;
        setUserReactions((prev) => ({ ...prev, [postId]: reaction }));
      }
      setReactionCounts((prev) => ({ ...prev, [postId]: counts }));
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al reaccionar');
    } finally {
      setReactionLoading(null);
    }
  };

  const handleSendComment = async (postId: string) => {
    const content = (commentInputs[postId] ?? '').trim();
    if (!content) return;
    if (!userEmail.trim()) {
      toast.error('Inicia sesión para comentar');
      return;
    }
    const rl = rateLimit.comment();
    if (!rl.allowed && rl.retryAfterMs != null) {
      toast.error(`Espera ${Math.ceil(rl.retryAfterMs / 1000)} s antes de comentar de nuevo`);
      return;
    }
    setSendingCommentFor(postId);
    try {
      await feedService.createComment({
        post_id: postId,
        user_email: userEmail,
        user_display_name: userDisplayName,
        content,
      });
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al comentar');
    } finally {
      setSendingCommentFor(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 overflow-x-hidden w-full max-w-full">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate('/home')}
        subtitle="Feed"
      />

      <div className="p-4 space-y-4">
        {/* Filtro por tema */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {FEED_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTopic(t)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedTopic === t
                  ? 'bg-gold-500/90 text-black'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-600'
              }`}
            >
              {TOPIC_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Nueva publicación */}
        <Card className="bg-zinc-900/80 border border-gold-500/20 transition-all hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/10">
          <CardContent className="p-4">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-gold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{userDisplayName}</p>
                <p className="text-xs text-zinc-500">Publicar al feed del campus</p>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-2">Tema</p>
              <div className="flex flex-wrap gap-2">
                {FEED_TOPICS.filter((t) => t !== 'general').map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewPostTopic(t)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      newPostTopic === t
                        ? 'bg-gold-500/90 text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-600'
                    }`}
                  >
                    {TOPIC_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="¿Qué quieres compartir con el campus?"
              className="w-full min-h-[88px] rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder-zinc-500 p-3 resize-y focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all text-sm"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              maxLength={feedService.MAX_CONTENT_LENGTH}
              aria-label="Contenido de la publicación"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-zinc-500">
                {newPostContent.length}/{feedService.MAX_CONTENT_LENGTH}
              </span>
              <Button
                onClick={handleCreatePost}
                disabled={posting || !newPostContent.trim()}
                className="bg-gold-600 hover:bg-gold-500 text-black font-medium rounded-lg px-4"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2">Publicar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de publicaciones */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-gold-500 mb-3" />
            <p className="text-zinc-500 text-sm">Cargando feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-zinc-900/80 border border-zinc-700 overflow-hidden">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gold-500/80" />
              </div>
              <p className="text-zinc-400 font-medium mb-1">No hay publicaciones aún</p>
              <p className="text-zinc-500 text-sm">Sé el primero en compartir algo con el campus</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isExpanded = expandedPostId === post.id;
              const comments = commentsByPost[post.id] ?? [];
              const commentText = commentInputs[post.id] ?? '';
              const sending = sendingCommentFor === post.id;
              const authorName = post.user_display_name || post.user_email || 'Anónimo';
              const topic = (post.topic ?? 'general') as FeedTopic;
              const counts = reactionCounts[post.id] ?? { like: 0, dislike: 0 };
              const myReaction = userReactions[post.id];
              const reacting = reactionLoading === post.id;
              return (
                <Card
                  key={post.id}
                  className="bg-zinc-900/80 border border-zinc-700 overflow-hidden transition-all duration-300 hover:border-gold-500/30 hover:shadow-lg hover:shadow-gold-500/5"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gold-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white">{authorName}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300 border border-zinc-600">
                            {TOPIC_LABELS[topic]}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">{formatDate(post.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pl-[52px]">
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        <SafeText text={post.content} />
                      </p>
                    </div>
                    {/* Like / Dislike */}
                    <div className="mt-3 pl-[52px] flex items-center gap-4">
                      <button
                        type="button"
                        disabled={reacting}
                        onClick={() => handleSetReaction(post.id, 'like')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          myReaction === 'like'
                            ? 'bg-gold-500/30 text-gold-400 border border-gold-500/50'
                            : 'text-zinc-400 hover:text-gold-400 hover:bg-gold-500/10 border border-transparent'
                        }`}
                        aria-label="Like"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{counts.like}</span>
                      </button>
                      <button
                        type="button"
                        disabled={reacting}
                        onClick={() => handleSetReaction(post.id, 'dislike')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          myReaction === 'dislike'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent'
                        }`}
                        aria-label="Dislike"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{counts.dislike}</span>
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-zinc-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors rounded-lg px-3 py-1.5 -ml-1"
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 mr-1.5" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-1.5" />
                      )}
                      {comments.length > 0 ? `${comments.length} comentario(s)` : 'Ver comentarios'}
                    </Button>
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
                        {comments.length > 0 && (
                          <div className="space-y-2">
                            {comments.map((c) => (
                              <div key={c.id} className="flex gap-2 pl-[52px]">
                                <div className="flex-1 min-w-0 rounded-xl bg-zinc-800/80 p-3 border border-zinc-700/50">
                                  <p className="text-xs font-medium text-gold-400/90">
                                    {c.user_display_name || c.user_email || 'Anónimo'}
                                  </p>
                                  <p className="text-sm text-zinc-200 mt-0.5">
                                    <SafeText text={c.content} />
                                  </p>
                                  <p className="text-xs text-zinc-500 mt-1">{formatDate(c.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pl-[52px]">
                          <input
                            type="text"
                            placeholder="Escribe un comentario..."
                            className="flex-1 rounded-xl bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-shadow"
                            value={commentText}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendComment(post.id);
                            }}
                            maxLength={feedService.MAX_CONTENT_LENGTH}
                            aria-label="Comentario"
                          />
                          <Button
                            size="sm"
                            disabled={sending || !commentText.trim()}
                            onClick={() => handleSendComment(post.id)}
                            className="bg-gold-600 hover:bg-gold-500 text-black rounded-xl px-4"
                          >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Feed;
