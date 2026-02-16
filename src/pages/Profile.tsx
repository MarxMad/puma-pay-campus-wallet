import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Copy, Award, Target, GraduationCap, Trophy, CheckCircle2, PiggyBank, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { useQuery } from '@tanstack/react-query';
import { coursesService } from '@/services/coursesService';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { goals } = useSavingsGoals();
  const { userPoints, getUserBadges } = useCourseProgress();
  const [badges, setBadges] = useState<any[]>([]);

  // Obtener todos los cursos
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.listCourses,
  });

  // Obtener badges
  useEffect(() => {
    const loadBadges = async () => {
      if (user) {
        try {
          const userBadges = await getUserBadges();
          setBadges(userBadges || []);
        } catch (error) {
          console.error('Error loading badges:', error);
          setBadges([]);
        }
      }
    };
    loadBadges();
  }, [user]); // Removed getUserBadges from dependencies to avoid infinite loops

  // Filtrar metas completadas
  const achievedGoals = (goals || []).filter(goal => goal.achieved);

  // Obtener cursos completados
  const completedCourses = courses.filter(course => {
    try {
      const progressKey = `${user?.address || user?.email || 'anonymous'}_${course.id}`;
      const stored = localStorage.getItem('pumapay_course_gamification');
      if (!stored) return false;
      const data = JSON.parse(stored);
      return data.courseProgress?.[progressKey]?.completed === true;
    } catch (error) {
      console.error('Error reading course progress:', error);
      return false;
    }
  });

  const handleCopyWallet = async () => {
    if (user?.address) {
      try {
        await navigator.clipboard.writeText(user.address);
        toast({ title: 'Copiado', description: 'Dirección copiada al portapapeles' });
      } catch (error) {
        console.error('Error al copiar:', error);
        toast({ title: 'Error', description: 'No se pudo copiar la dirección', variant: 'destructive' });
      }
    }
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
      navigate('/welcome');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 overflow-x-hidden w-full max-w-full">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate('/home')}
        subtitle="Mi Perfil"
      />
            
      <div className="p-4 sm:px-6 space-y-6">
        {/* Profile Info Card - estilo Cursos */}
        <Card className="bg-black/30 border-2 border-gold-500/20 p-6 text-white hover:border-gold-500/40 transition-all">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl border-2 border-gold-500/40 text-black font-bold text-2xl">
              {user?.name ? user.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
            <h1 className="text-xl font-bold text-white">{user?.name || 'Usuario'}</h1>
            <p className="text-gray-400 mb-4">{user?.email || 'Sin email'}</p>
            
            {/* Wallet Info */}
            <div className="bg-black/30 border border-gold-500/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Dirección de wallet</span>
                <Button
                  type="button"
                  onClick={handleCopyWallet}
                  variant="ghost"
                  size="sm"
                  className="text-gold-400 hover:text-gold-400 hover:bg-gold-500/20 h-8 px-2 text-xs gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </Button>
              </div>
              <p className="text-xs font-mono text-gold-400/90 break-all">
                {user?.address}
              </p>
            </div>
          </div>
        </Card>

        {/* Estadísticas rápidas - estilo Cursos */}
        <div className="grid grid-cols-2 gap-4">
          {false && (
          <Card className="bg-black/30 border-2 border-gold-500/20 p-4 text-white hover:border-gold-500/40 transition-all">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gold-500/20 border border-gold-500/40 rounded-xl flex items-center justify-center text-gold-400">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Metas completadas</p>
                <p className="text-2xl font-bold text-white">{achievedGoals.length}</p>
              </div>
            </div>
          </Card>
          )}
          <Card className="bg-black/30 border-2 border-gold-500/20 p-4 text-white hover:border-gold-500/40 transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gold-500/20 border border-gold-500/40 rounded-xl flex items-center justify-center text-gold-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Guías completadas</p>
                <p className="text-2xl font-bold text-white">{completedCourses.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Puntos del usuario - estilo Cursos */}
        {userPoints && (
          <Card className="bg-black/30 border-2 border-gold-500/20 p-6 text-white hover:border-gold-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gold-500/20 border-2 border-gold-500/40 rounded-xl flex items-center justify-center text-gold-400">
                  <Star className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Puntos totales</p>
                  <p className="text-3xl font-bold text-white">{userPoints.totalPoints || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {userPoints.coursesCompleted || 0} guías completadas
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Logros de Ahorro: sección oculta (código conservado) */}
        {false && (
        <Card className="bg-gray-800/70 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <PiggyBank className="h-5 w-5 text-gold-500" />
              Logros de Ahorro
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievedGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-500 opacity-50" />
                <p className="text-gray-400">Aún no has completado ninguna meta de ahorro</p>
                <Button
                  onClick={() => navigate('/savings-goals')}
                  className="mt-4 bg-gold-500 hover:bg-gold-600 text-white"
                >
                  Ver metas de ahorro
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {achievedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 border border-gold-500/30 rounded-xl p-4 flex items-center space-x-4"
                  >
                    <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">Meta completada</p>
                      <p className="text-sm text-gray-300">
                        Objetivo: ${goal.targetAmount.toFixed(2)}
                      </p>
                      {goal.proofId && (
                        <p className="text-xs text-gold-400 mt-1">
                          ✓ Verificado con ZK Proof
                        </p>
                      )}
                    </div>
                    <Trophy className="h-6 w-6 text-positive-400 flex-shrink-0" />
                  </div>
                ))}
                <Button
                  onClick={() => navigate('/savings-goals')}
                  variant="outline"
                  className="w-full border-gold-500/30 text-zinc-300 hover:text-zinc-300 hover:bg-gold-500/10"
                >
                  Ver todas las metas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Logros de Guías - estilo Cursos */}
        <Card className="bg-black/30 border-2 border-gold-500/20 text-white hover:border-gold-500/40 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <GraduationCap className="h-5 w-5 text-gold-400" />
              Logros de Guías
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedCourses.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-500 opacity-50" />
                <p className="text-gray-400">Aún no has completado ninguna guía</p>
                <Button
                  type="button"
                  onClick={() => navigate('/courses')}
                  className="mt-4 bg-gold-500 hover:bg-gold-600 text-black font-semibold"
                >
                  Explorar guías
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {completedCourses.map((course) => {
                  const progressKey = `${user?.address || user?.email || 'anonymous'}_${course.id}`;
                  const stored = localStorage.getItem('pumapay_course_gamification');
                  let progress: any = null;
                  if (stored) {
                    const data = JSON.parse(stored);
                    progress = data.courseProgress?.[progressKey];
                  }

                  const badgeEmoji = progress?.badgeLevel === 3 ? '🥇' : progress?.badgeLevel === 2 ? '🥈' : '🥉';

                  return (
                    <div
                      key={course.id}
                      className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 flex items-center space-x-4"
                    >
                      <div className="w-12 h-12 bg-gold-500/20 border border-gold-500/40 rounded-xl flex items-center justify-center flex-shrink-0 text-gold-400">
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{course.title}</p>
                        <p className="text-sm text-gray-400">
                          {progress?.quizScore ? `Puntuación: ${progress.quizScore}%` : 'Completado'}
                        </p>
                        {progress?.badgeLevel && (
                          <p className="text-xs text-gold-400 mt-1">
                            {badgeEmoji} Badge obtenido
                          </p>
                        )}
                      </div>
                      {progress?.badgeLevel && (
                        <div className="text-2xl flex-shrink-0">{badgeEmoji}</div>
                      )}
                    </div>
                  );
                })}
                <Button
                  type="button"
                  onClick={() => navigate('/courses')}
                  variant="outline"
                  className="w-full border-gold-500/40 text-gold-400 hover:text-gold-400 hover:bg-gold-500/10"
                >
                  Ver todos los cursos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges obtenidos - estilo Cursos */}
        {badges.length > 0 && (
          <Card className="bg-black/30 border-2 border-gold-500/20 text-white hover:border-gold-500/40 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-gold-400" />
                Badges Obtenidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge, index) => {
                  const badgeEmoji = badge.level === 3 ? '🥇' : badge.level === 2 ? '🥈' : '🥉';
                  return (
                    <div
                      key={index}
                      className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-3 text-center"
                    >
                      <div className="text-3xl mb-2">{badgeEmoji}</div>
                      <p className="text-xs text-gray-400">
                        {badge.level === 3 ? 'Gold' : badge.level === 2 ? 'Silver' : 'Bronze'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cerrar sesión - estilo Cursos */}
        <Card className="bg-black/30 border-2 border-gold-500/20 text-white hover:border-gold-500/40 transition-all">
          <CardContent className="pt-6">
            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500/40 text-red-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
