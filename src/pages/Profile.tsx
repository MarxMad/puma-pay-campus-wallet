import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, LogOut, Copy, Award, Target, GraduationCap, Trophy, CheckCircle2, PiggyBank, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
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
        alert('Dirección de wallet copiada al portapapeles');
      } catch (error) {
        console.error('Error al copiar:', error);
        alert('Error al copiar la dirección');
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
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-blue-400/40 p-2 sm:p-2.5">
            <img src="/PumaPay.png" alt="PumaPay" className="h-full w-full object-contain drop-shadow-lg rounded-2xl" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              PumaPay
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">Mi Perfil</p>
          </div>
        </div>
        <div className="w-8" aria-hidden />
      </div>
            
      <div className="p-4 space-y-6">
        {/* Profile Info Card */}
        <Card className="bg-gray-800/70 border-white/10 p-6 text-white shadow-xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl ring-4 ring-blue-400/20">
              <span className="text-2xl font-bold">
                {user?.name ? user.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() : 'U'}
              </span>
            </div>
            <h1 className="text-xl font-bold">{user?.name || 'Usuario'}</h1>
            <p className="text-gray-400 mb-4">{user?.email || 'Sin email'}</p>
            
            {/* Wallet Info */}
            <div className="bg-gray-700/50 p-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Wallet Address</span>
                <Button
                  onClick={handleCopyWallet}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-1 h-6 w-6"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs font-mono text-gray-300 break-all">
                {user?.address}
              </p>
            </div>
          </div>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-blue-500/40 p-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white font-medium">Metas completadas</p>
                <p className="text-2xl font-bold text-white">{achievedGoals.length}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 border-yellow-500/40 p-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
    </div>
    <div>
                <p className="text-xs text-white font-medium">Cursos completados</p>
                <p className="text-2xl font-bold text-white">{completedCourses.length}</p>
    </div>
          </div>
        </Card>
        </div>

        {/* Puntos del usuario */}
        {userPoints && (
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-white/20 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Puntos totales</p>
                  <p className="text-3xl font-bold text-white">{userPoints.totalPoints || 0}</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {userPoints.coursesCompleted || 0} cursos completados
                  </p>
                </div>
              </div>
          </div>
        </Card>
        )}

        {/* Logros de Ahorro */}
        <Card className="bg-gray-800/70 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <PiggyBank className="h-5 w-5 text-blue-400" />
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
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Ver metas de ahorro
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {achievedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 flex items-center space-x-4"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">Meta completada</p>
                      <p className="text-sm text-gray-300">
                        Objetivo: ${goal.targetAmount.toFixed(2)}
                      </p>
                      {goal.proofId && (
                        <p className="text-xs text-blue-300 mt-1">
                          ✓ Verificado con ZK Proof
                        </p>
                      )}
                    </div>
                    <Trophy className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                  </div>
                ))}
                <Button
                  onClick={() => navigate('/savings-goals')}
                  variant="outline"
                  className="w-full border-blue-400/30 text-blue-200 hover:bg-blue-500/10"
                >
                  Ver todas las metas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logros de Cursos */}
        <Card className="bg-gray-800/70 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <GraduationCap className="h-5 w-5 text-yellow-400" />
              Logros de Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedCourses.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-500 opacity-50" />
                <p className="text-gray-400">Aún no has completado ningún curso</p>
                <Button
                  onClick={() => navigate('/courses')}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Explorar cursos
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
                      className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 flex items-center space-x-4"
                    >
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{course.title}</p>
                        <p className="text-sm text-gray-300">
                          {progress?.quizScore ? `Puntuación: ${progress.quizScore}%` : 'Completado'}
                        </p>
                        {progress?.badgeLevel && (
                          <p className="text-xs text-yellow-300 mt-1">
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
                  onClick={() => navigate('/courses')}
                  variant="outline"
                  className="w-full border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/10"
                >
                  Ver todos los cursos
              </Button>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Badges obtenidos */}
        {badges.length > 0 && (
          <Card className="bg-gray-800/70 border-white/10 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-yellow-400" />
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
                      className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-3 text-center"
                    >
                      <div className="text-3xl mb-2">{badgeEmoji}</div>
                      <p className="text-xs text-gray-300">
                        {badge.level === 3 ? 'Gold' : badge.level === 2 ? 'Silver' : 'Bronze'}
              </p>
            </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cerrar sesión */}
        <Card className="bg-gray-800/70 border-white/10 text-white">
          <CardContent className="pt-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
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
