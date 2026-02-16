import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { feedService, type FeedPost, type FeedComment } from '@/services/feedService';
import { toast } from 'sonner';

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
        <Card className="bg-zinc-900/80 border-zinc-700 transition-all hover:shadow-lg hover:shadow-gold-500/5 hover:border-gold-500/20">
          <CardContent className="p-4">
            <textarea
              placeholder="¿Qué quieres compartir?"
              className="w-full min-h-[80px] rounded-lg bg-zinc-800/50 border border-zinc-600 text-white placeholder-zinc-400 p-3 resize-y focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500/50 transition-all"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              maxLength={feedService.MAX_CONTENT_LENGTH}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-zinc-400">
                {newPostContent.length}/{feedService.MAX_CONTENT_LENGTH}
              </span>
              <Button
                onClick={handleCreatePost}
                disabled={posting || !newPostContent.trim()}
                className="bg-gold-600 hover:bg-gold-500 text-black"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2">Publicar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de publicaciones */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-zinc-900/80 border-zinc-700 animate-feed-in">
            <CardContent className="py-12 text-center text-zinc-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay publicaciones aún. ¡Sé el primero!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post, index) => {
              const isExpanded = expandedPostId === post.id;
              const comments = commentsByPost[post.id] ?? [];
              const commentText = commentInputs[post.id] ?? '';
              const sending = sendingCommentFor === post.id;
              return (
                <Card
                  key={post.id}
                  className="bg-zinc-900/80 border-zinc-700 overflow-hidden transition-all duration-300 hover:border-gold-500/30 hover:shadow-lg hover:shadow-gold-500/5 animate-feed-in"
                  style={{ animationDelay: `${Math.min(index * 80, 400)}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">
                          {post.user_display_name || post.user_email || 'Anónimo'}
                        </p>
                        <p className="text-xs text-zinc-400">{formatDate(post.created_at)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-zinc-200 whitespace-pre-wrap break-words">{post.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-zinc-400 hover:text-zinc-400 hover:bg-gold-500/10 transition-colors rounded-md px-2 py-1"
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      )}
                      {comments.length > 0 ? `${comments.length} comentario(s)` : 'Comentarios'}
                    </Button>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-zinc-700 space-y-3 animate-feed-in">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <div className="flex-1 min-w-0 rounded-lg bg-zinc-800/50 p-2 border border-zinc-700/50">
                              <p className="text-xs font-medium text-gold-400/90">
                                {c.user_display_name || c.user_email || 'Anónimo'}
                              </p>
                              <p className="text-sm text-zinc-200 break-words">{c.content}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{formatDate(c.created_at)}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Escribe un comentario..."
                            className="flex-1 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500/50 transition-shadow"
                            value={commentText}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendComment(post.id);
                            }}
                          />
                          <Button
                            size="sm"
                            disabled={sending || !commentText.trim()}
                            onClick={() => handleSendComment(post.id)}
                            className="bg-gold-600 hover:bg-gold-500 text-black transition-colors"
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
