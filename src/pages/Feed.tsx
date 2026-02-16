import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Send, Loader2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { feedService, type FeedPost, type FeedComment } from '@/services/feedService';
import { toast } from 'sonner';
import { sanitizeContent } from '@/utils/feedSanitize';
import { rateLimit } from '@/utils/rateLimit';

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
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingCommentFor, setSendingCommentFor] = useState<string | null>(null);

  const userEmail = user?.email ?? '';
  const userDisplayName = user?.name ?? user?.email ?? 'Anónimo';

  const loadPosts = useCallback(async () => {
    try {
      const list = await feedService.getPosts();
      setPosts(list);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar las publicaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const unsub = feedService.subscribePosts((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setPosts((prev) => [payload.new!, ...prev]);
      }
      if (payload.eventType === 'DELETE' && payload.old) {
        setPosts((prev) => prev.filter((p) => p.id !== payload.old!.id));
      }
    });
    return unsub;
  }, []);

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
      });
      setNewPostContent('');
      toast.success('Publicado');
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al publicar');
    } finally {
      setPosting(false);
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
            {posts.map((post, index) => {
              const isExpanded = expandedPostId === post.id;
              const comments = commentsByPost[post.id] ?? [];
              const commentText = commentInputs[post.id] ?? '';
              const sending = sendingCommentFor === post.id;
              const authorName = post.user_display_name || post.user_email || 'Anónimo';
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
                        <p className="font-medium text-white">{authorName}</p>
                        <p className="text-xs text-zinc-500">{formatDate(post.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pl-[52px]">
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        <SafeText text={post.content} />
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-zinc-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors rounded-lg px-3 py-1.5 -ml-1"
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
