import { useState, useEffect } from 'react';
import { Bell, Home, Search, Settings, User, ArrowUp, ArrowDown, ArrowLeftRight, Eye, EyeOff, TrendingUp, TrendingDown, Plus, Banknote, BarChart3, Send, Download, Repeat, Zap, Sparkles, Activity, MapPin, QrCode, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Tag, CheckCircle, XCircle, Loader2, Star, StarHalf, StarOff, Info, AlertTriangle, ShieldCheck, Gift, Trophy, GraduationCap, Users, Globe, Calendar, FileText, FilePlus, FileMinus, FileCheck, FileX, File, Copy, RefreshCw, PartyPopper, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
// ⚠️ COMENTADO - Ahora usamos Stellar
// import { bitsoService } from '@/services/bitso';
// import { portalService } from '@/services/portal';
// import { junoService } from '@/services/junoService';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { SkeletonBalance } from '../components/SkeletonLoader';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { stellarService } from '@/services/stellarService';
import { getLeaderboardTop50, type LeaderboardEntry } from '@/services/supabaseCourseProgress';

// Extensión temporal del tipo Transaction para props extra de portalService
type TransactionWithToken = import('@/types/categories').Transaction & { isUSDC?: boolean; tokenSymbol?: string };

// Insignias por puntaje (cada 500 pts hasta 10_000)
const ACHIEVEMENT_BADGES: { points: number; name: string; emoji: string }[] = [
  { points: 500, name: 'Primer paso', emoji: '🌱' },
  { points: 1000, name: 'En camino', emoji: '👣' },
  { points: 1500, name: 'Constante', emoji: '📚' },
  { points: 2000, name: 'Avanzado', emoji: '⚡' },
  { points: 2500, name: 'Destacado', emoji: '🌟' },
  { points: 3000, name: 'Estrella', emoji: '⭐' },
  { points: 3500, name: 'Brillante', emoji: '✨' },
  { points: 4000, name: 'Experto', emoji: '🎯' },
  { points: 4500, name: 'Maestro', emoji: '🏆' },
  { points: 5000, name: 'Campeón', emoji: '🥇' },
  { points: 5500, name: 'Leyenda', emoji: '👑' },
  { points: 6000, name: 'Ídolo', emoji: '🔥' },
  { points: 6500, name: 'Fenómeno', emoji: '💎' },
  { points: 7000, name: 'Pro', emoji: '🚀' },
  { points: 7500, name: 'Elite', emoji: '💫' },
  { points: 8000, name: 'Supremo', emoji: '🎖️' },
  { points: 8500, name: 'Puma', emoji: '🐾' },
  { points: 9000, name: 'Oro', emoji: '🥇' },
  { points: 9500, name: 'Máximo', emoji: '👑' },
  { points: 10000, name: 'Legendario', emoji: '🏅' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingMsg, setFundingMsg] = useState('');
  const [showFundingSuccess, setShowFundingSuccess] = useState(false);
  const [showFundingAnimation, setShowFundingAnimation] = useState(false);
  const [funded, setFunded] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    // Verificar si la cuenta ya fue fondeada
    const fundedKey = `pumapay_funded_${user?.address}`;
    setFunded(localStorage.getItem(fundedKey) === 'true');
  }, [user?.address]);

  // Leaderboard top 50 desde Supabase
  useEffect(() => {
    let cancelled = false;
    setLeaderboardLoading(true);
    getLeaderboardTop50()
      .then((data) => {
        if (!cancelled) setLeaderboard(data);
      })
      .catch(() => {
        if (!cancelled) setLeaderboard([]);
      })
      .finally(() => {
        if (!cancelled) setLeaderboardLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleFundAccount = async () => {
    console.log('💰 Iniciando fondeo de cuenta Stellar:', user);
    
    if (!user?.address) {
      toast({ title: 'Error', description: 'No se encontró tu dirección de wallet. Completa tu registro primero.', variant: 'destructive' });
      return;
    }
    
    setFundingLoading(true);
    setFundingMsg('Fondeando cuenta en testnet...');
    
    try {
      console.log('🔄 Fondeando cuenta con Friendbot (10,000 XLM)...');
      setFundingMsg('Solicitando 10,000 XLM desde Friendbot...');
      
      // Llamar a friendbot para fondear la cuenta
      const result = await stellarService.fundWithFriendbot(user.address);
      
      console.log('✅ Cuenta fondeada exitosamente:', result);
      setFundingMsg('¡Cuenta fondeada exitosamente!');
      
      // Marcar como fondeada
      const fundedKey = `pumapay_funded_${user.address}`;
      localStorage.setItem(fundedKey, 'true');
      setFunded(true);
      
      toast({ title: 'Cuenta fondeada', description: 'Has recibido 10,000 XLM en testnet correctamente.' });
      
      // Mostrar animación de éxito
      setShowFundingAnimation(true);
      setShowFundingSuccess(true);
      
      // Ocultar animación después de 3 segundos
      setTimeout(() => {
        setShowFundingAnimation(false);
      }, 3000);
      
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setShowFundingSuccess(false);
      }, 5000);
      
      // Actualizar balance después de un pequeño delay
      setTimeout(() => {
        refreshBalance();
      }, 2000);
      
      console.log('🎉 Proceso de fondeo completado exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error fondeando cuenta:', error);
      const msg = error?.message || 'Intenta nuevamente.';
      setFundingMsg(`Error al fondear cuenta: ${msg}`);
      toast({ title: 'Error al fondear', description: msg, variant: 'destructive' });
    } finally {
      setFundingLoading(false);
    }
  };

  // Hook de categorías para obtener datos reales
  const { 
    getRecentTransactions, 
    getTotalExpenses, 
    getTotalIncome, 
    getGlobalBudgetProgress,
    getCategoryStats,
    isLoading: categoriesLoading 
  } = useCategories();

  // Hook de balance para obtener balance real del usuario desde blockchain
  const { 
    available, 
    assetSymbol,
    isLoading: balanceLoading, 
    refreshBalance,
    getRealBalanceFromBlockchain
  } = useBalance();

  const { userPoints } = useCourseProgress();
  const totalPoints = userPoints?.totalPoints ?? 0;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<Date | null>(null);

  // Actualizar balance cuando hay eventos (transacciones nuevas)
  // NO llamar al montar porque useBalance ya lo hace
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout;
    
    const handleUpdate = async () => {
      // Debounce: Esperar 1 segundo antes de actualizar para evitar múltiples llamadas
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(async () => {
        if (!isRefreshing && !balanceLoading) {
          console.log('🔄 Actualizando balance desde blockchain por evento...');
          setIsRefreshing(true);
          try {
            await refreshBalance();
            setLastBalanceUpdate(new Date());
          } catch (error) {
            console.error('❌ Error actualizando balance:', error);
          } finally {
            setIsRefreshing(false);
          }
        }
      }, 1000); // Debounce de 1 segundo
    };

    // Escuchar eventos de transacciones
    window.addEventListener('transactionAdded', handleUpdate);
    window.addEventListener('forceBalanceUpdate', handleUpdate);
    
    return () => {
      clearTimeout(updateTimeout);
      window.removeEventListener('transactionAdded', handleUpdate);
      window.removeEventListener('forceBalanceUpdate', handleUpdate);
    };
  }, [refreshBalance, isRefreshing, balanceLoading]);

  // Actualización periódica del balance (cada 60 segundos, menos agresivo)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!balanceLoading && !isRefreshing) {
        // Log removido para reducir spam en consola
        // console.log('🔄 Actualización periódica del balance...');
        setIsRefreshing(true);
        try {
          await refreshBalance();
          setLastBalanceUpdate(new Date());
        } catch (error) {
          console.error('❌ Error en actualización periódica:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    }, 60000); // 60 segundos (más razonable)

    return () => clearInterval(interval);
  }, [balanceLoading, isRefreshing, refreshBalance]);

  // Datos reales de categorías y transacciones
  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const budgetProgress = getGlobalBudgetProgress();
  const categoryStats = getCategoryStats();
  const realTransactions = getRecentTransactions(10).filter(tx => tx.txHash && tx.txHash.length > 0);
  
  // Calcular progreso del presupuesto mensual global
  const monthlyGoalProgress = Math.round(budgetProgress.progress);

  // Helper para formatear transacciones para la UI
  const formatTransactionForDisplay = (transaction: any) => {
    const categories = [...categoryStats];
    const category = categories.find(c => c.id === transaction.categoryId);
    
    const formatTime = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays === 0) {
        if (diffHours === 0) return 'Hace un momento';
        return `${diffHours}h`;
      } else if (diffDays === 1) {
        return 'Ayer';
      } else {
        return `${diffDays}d`;
      }
    };

    return {
      id: transaction.id,
      merchant: transaction.recipient || transaction.description || 'Transacción',
      amount: `${transaction.type === 'expense' ? '-' : '+'}$${transaction.amount.toFixed(2)}`,
      time: formatTime(transaction.date),
      icon: category?.icon || (transaction.type === 'expense' ? '💸' : '💰'),
      type: transaction.type,
      change: '' // No calculamos cambios por ahora
    };
  };

  // Función handleDeposit eliminada - los depósitos se hacen en /receive

  const quickActions = [
    { to: '/feed', icon: MessageSquare, label: 'Feed', color: 'bg-gold-600 hover:bg-gold-500 text-black' },
    { to: '/send', icon: Send, label: 'Enviar', color: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
    { to: '/receive', icon: Download, label: 'Recibir', color: 'bg-positive-600 hover:bg-positive-500 text-white' },
    { to: '/marketplace', icon: Gift, label: 'Tienda', color: 'bg-rose-600 hover:bg-rose-500 text-white' },
  ];

  // Calcular gastos por día de la semana
  const calculateWeeklySpending = () => {
    const today = new Date();
    const weekData = [];
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayExpenses = realTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'expense' && 
                 tDate.toDateString() === date.toDateString();
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      weekData.push({
        day: dayNames[date.getDay()],
        amount: dayExpenses // Solo gastos reales, no datos aleatorios
      });
    }
    
    return weekData;
  };

  const weeklySpending = calculateWeeklySpending();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 overflow-x-hidden w-full max-w-full">
      <AppHeader
        leftAction={<User className={headerIconClass} />}
        onLeftAction={() => navigate('/profile')}
        subtitle="Inicio"
        rightAction={<Bell className={headerIconClass} />}
        onRightAction={() => navigate('/notifications')}
        showNotificationDot
      />

      {/* Wallet Info - Tema oscuro */}
      <div className="p-4">
        <Card className="bg-black/40 backdrop-blur-xl border-2 border-gold-500/20 p-5 sm:p-6 text-white mb-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-[0.06]">
            <img src="/PumaPay.png" alt="" className="h-24 w-24 object-contain" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl flex items-center justify-center border border-gold-500/40 p-2">
                  <img src="/PumaPay.png" alt="PumaPay" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">PumaPay Wallet</h2>
                  <p className="text-xs text-gray-400">Tu wallet estudiantil</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowBalance((prev) => !prev); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
                aria-label={showBalance ? 'Ocultar balance' : 'Mostrar balance'}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="mb-5 pb-5 border-b border-white/10">
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Balance disponible</span>
              {balanceLoading ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gold-400" />
                  <span className="text-gray-500 text-sm">Cargando...</span>
                </div>
              ) : (
                <div className="mt-1">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                    {showBalance ? `$${available.toFixed(2)}` : '••••••'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
                    <span className="text-gold-400/90 text-sm">{assetSymbol || 'USDC'}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <span className="text-gray-500 text-xs">Dirección</span>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="font-mono text-gold-400/90 text-xs break-all">{user?.address}</span>
                {user?.address && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(user.address);
                      toast({ title: 'Copiado', description: 'Dirección copiada al portapapeles' });
                    }}
                    className="h-7 px-2 text-gold-400 hover:text-gold-400 hover:bg-gold-500/20 rounded text-xs gap-1"
                    aria-label="Copiar dirección"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </Button>
                )}
              </div>
            </div>
            {/* ⚠️ COMENTADO - Tarjetas de advertencia sobre CLABE y wallet */}
            {/*
            {user?.clabe && (
              <div className="bg-green-100 p-4 rounded-lg mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-green-900 mb-2">Tu CLABE para depósitos:</div>
                  <div className="font-mono text-xl md:text-2xl text-green-800 select-all tracking-widest break-all overflow-wrap-anywhere" style={{ letterSpacing: '0.1em', wordBreak: 'break-all' }}>{user?.clabe}</div>
                  <div className="text-green-900 text-sm mt-2 break-words">Deposita MXN a esta CLABE desde cualquier banco para fondear tu wallet PumaPay. Cada depósito se convertirá automáticamente en USDC.</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {navigator.clipboard.writeText(user?.clabe || ''); alert('CLABE copiada al portapapeles')}}
                  className="text-green-700 hover:text-green-900 flex-shrink-0"
                >
                  Copiar
                </Button>
              </div>
            )}
            {user?.clabe && (
              <div className="mt-4 mb-6">
                <div className="p-4 bg-blue-50 border border-zinc-300 rounded mb-2">
                  <div className="font-semibold text-blue-800 mb-1">¿Cómo funciona el fondeo?</div>
                  <div className="text-xs text-blue-700">
                    1. Deposita MXN a tu CLABE desde cualquier banco vía SPEI.<br />
                    2. El sistema detecta el depósito y automáticamente convierte los MXN en USDC.<br />
                    3. Tu balance de USDC se actualiza en PumaPay y puedes usarlo en el campus.
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <div className="font-semibold text-green-800 mb-1">¿Cómo funciona el retiro?</div>
                  <div className="text-xs text-green-700">
                    1. Enlaza tu cuenta bancaria personal (CLABE) en tu perfil.<br />
                    2. Solicita un retiro/redemption desde la app.<br />
                    3. El sistema convierte tus USDC a MXN y los transfiere a tu cuenta bancaria.
                  </div>
                </div>
              </div>
            )}
            */}
          </div>
        </Card>
      </div>

      {/* Actualizar balance */}
      <div className="px-4 sm:px-6 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            setIsRefreshing(true);
            try {
              await refreshBalance();
              setLastBalanceUpdate(new Date());
              toast({ title: 'Balance actualizado', description: 'El saldo se actualizó correctamente desde la red.' });
            } catch (e) {
              toast({ title: 'Error', description: 'No se pudo actualizar el balance.', variant: 'destructive' });
            } finally {
              setIsRefreshing(false);
            }
          }}
          disabled={isRefreshing || balanceLoading}
          className="border-gold-500/30 text-gold-300 hover:text-gold-300 hover:bg-gold-500/10 rounded-xl"
          title="Actualizar balance desde blockchain"
        >
          {isRefreshing || balanceLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Actualizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar balance
            </>
          )}
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-black/30 border border-gold-500/20 p-4 relative overflow-hidden group hover:border-gold-500/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold-500/20 border border-gold-500/40 rounded-xl flex items-center justify-center text-gold-400 group-hover:scale-105 transition-transform">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Gastos</p>
                <p className="text-white font-bold text-lg tabular-nums">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-black/30 border border-gold-500/20 p-4 relative overflow-hidden group hover:border-gold-500/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold-500/20 border border-gold-500/40 rounded-xl flex items-center justify-center text-gold-400 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Ingresos</p>
                <p className="text-white font-bold text-lg tabular-nums">${totalIncome.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Gastos semanales */}
      {weeklySpending.some(d => d.amount > 0) && (
        <div className="px-4 sm:px-6 mb-6">
          <Card className="bg-black/30 border border-gold-500/20 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-500/20 border border-gold-500/40 rounded-xl flex items-center justify-center text-gold-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold">Gastos de la semana</h3>
                  <p className="text-gray-500 text-xs">Resumen</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Total</p>
                <p className="text-white font-bold">${weeklySpending.reduce((sum, d) => sum + d.amount, 0).toFixed(0)}</p>
              </div>
            </div>
            
            <div className="h-32 sm:h-40 flex items-end justify-between gap-2 sm:gap-3">
              {weeklySpending.map((day, i) => {
                const maxAmount = Math.max(...weeklySpending.map(d => d.amount), 100);
                const heightPercentage = day.amount > 0 ? Math.max((day.amount / maxAmount) * 100, 8) : 8;
                const isHovered = hoveredDay === i;
                const isToday = day.day === ['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date().getDay()];
                
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center space-y-2 flex-1 relative cursor-pointer group"
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className="w-full bg-gray-700/30 rounded-lg relative overflow-hidden" style={{ height: '100%' }}>
                      {day.amount > 0 ? (
                        <div 
                          className={`w-full absolute bottom-0 rounded-lg transition-all duration-500 ease-out transform ${
                            isHovered ? 'scale-105' : 'scale-100'
                          } ${
                            isToday 
                              ? 'bg-gradient-to-t from-gold-600 via-gold-500 to-gold-400' 
                              : 'bg-gradient-to-t from-gold-700 via-gold-600 to-gold-500'
                          }`}
                          style={{ 
                            height: `${heightPercentage}%`,
                            boxShadow: isHovered ? '0 0 20px rgba(212, 160, 18, 0.5)' : 'none'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000"></div>
                        </div>
                      ) : (
                        <div className="w-full h-2 bg-gray-600/50 rounded-lg absolute bottom-0 opacity-50"></div>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <span className={`text-xs sm:text-sm font-semibold block transition-all duration-200 ${
                        isToday 
                          ? 'text-gold-500' 
                          : isHovered 
                            ? 'text-gold-400' 
                            : 'text-gray-400'
                      }`}>
                        {day.day}
                      </span>
                      {isHovered && day.amount > 0 && (
                        <span className="text-xs text-white font-bold mt-1 block">
                          ${day.amount.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-gold-400 rounded-full" />
                <span>Hoy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
                <span>Otros días</span>
              </div>
              <span className="text-gray-400">${(weeklySpending.reduce((sum, d) => sum + d.amount, 0) / 7).toFixed(0)}/día</span>
            </div>
          </Card>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="px-4 sm:px-6 mb-6">
        <h3 className="text-white text-base font-semibold mb-3">Acciones rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              type="button"
              onClick={() => navigate(action.to)}
              className={`${action.color} p-4 rounded-xl flex flex-col items-center justify-center gap-2 min-h-[80px] h-auto font-medium hover:opacity-90 active:scale-95 transition-all`}
            >
              <action.icon className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
              <span className="text-xs sm:text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Logros: insignias por puntaje (cursos) */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold-400" />
            Insignias
          </h3>
          <Badge className="bg-gold-500/20 border-gold-500/40 text-gold-300 text-xs">
            {totalPoints} pts
          </Badge>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {ACHIEVEMENT_BADGES.map((badge) => {
            const unlocked = totalPoints >= badge.points;
            return (
              <Card
                key={badge.points}
                className={`p-4 min-w-[100px] flex-shrink-0 transition-all ${
                  unlocked
                    ? 'bg-black/30 border-2 border-gold-500/40 hover:border-gold-500/60'
                    : 'bg-black/20 border border-white/10 opacity-60'
                }`}
              >
                <div className="text-center">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl ${
                      unlocked ? 'bg-gold-500/20 border border-gold-500/40' : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    {badge.emoji}
                  </div>
                  <p className={`font-medium text-sm mb-0.5 ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {badge.name}
                  </p>
                  <p className={`text-xs ${unlocked ? 'text-gold-400' : 'text-gray-500'}`}>
                    {badge.points} pts
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Campus Map */}
      <div className="px-4 sm:px-6 mb-6">
        <Card
          role="button"
          tabIndex={0}
          className="bg-black/30 border-2 border-gold-500/20 p-4 sm:p-5 text-white relative overflow-hidden hover:border-gold-500/40 transition-all cursor-pointer"
          onClick={() => navigate('/campus-map')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/campus-map'); } }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gold-500/20 border border-gold-500/40 rounded-xl flex items-center justify-center text-gold-400 flex-shrink-0">
                <MapPin className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold mb-1">🗺️ Descubre el Campus</h3>
                <p className="text-gray-300 text-sm sm:text-base mb-2">
                  Encuentra lugares que aceptan PumaPay
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-gold-400" />
                    <span className="text-gold-400 font-semibold">Descuentos exclusivos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gold-500">20+ lugares disponibles</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-left sm:text-right flex-shrink-0">
              <Badge className="bg-gold-500/20 border-gold-500/40 text-gold-300 text-xs mb-2">Nuevo</Badge>
              <div className="flex items-center gap-1 text-gold-400 text-sm">
                <span>Ver mapa</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Populares:</span>
            <div className="flex items-center space-x-1 bg-white/5 rounded-lg px-2 py-1">
              <span className="text-base sm:text-lg">🍕</span>
              <span className="text-xs sm:text-sm text-white">Cafetería</span>
            </div>
            <div className="flex items-center space-x-1 bg-white/5 rounded-lg px-2 py-1">
              <span className="text-base sm:text-lg">🏃‍♂️</span>
              <span className="text-xs sm:text-sm text-white">Gimnasio</span>
            </div>
            <div className="flex items-center space-x-1 bg-white/5 rounded-lg px-2 py-1">
              <span className="text-base sm:text-lg">📚</span>
              <span className="text-xs sm:text-sm text-white">Librería</span>
            </div>
          </div>
          
        </Card>
      </div>

      {/* Spending Overview - TEMPORALMENTE COMENTADO */}
      {/* 
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gold-500/20 backdrop-blur-lg border border-gold-500/30 p-5 relative overflow-hidden group hover:bg-gold-500/30 transition-all duration-300 shadow-lg shadow-gold-500/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Gastos del mes</p>
                <p className="text-white font-bold text-xl">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
            
            {monthlyGoalProgress > 0 && (
              <div className="mt-2 w-full bg-gold-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(monthlyGoalProgress, 100)}%` }}
                ></div>
              </div>
            )}
            
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-gold-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </Card>
          
          <Card className="bg-gold-500/20 backdrop-blur-lg border border-zinc-600 p-5 relative overflow-hidden group hover:bg-gold-500/30 transition-all duration-300 shadow-lg shadow-gold-500/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Meta mensual</p>
                <p className="text-white font-bold text-xl">{monthlyGoalProgress.toFixed(0)}%</p>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="rgb(191, 219, 254)"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="rgb(30, 64, 175)"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${(monthlyGoalProgress / 100) * 75.4} 75.4`}
                    className="transition-all duration-700"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-xs text-white">
                  ${budgetProgress.remaining.toFixed(0)} restante
                </p>
              </div>
            </div>
            
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-gold-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </Card>
        </div>
      </div>
      */}

      {/* Category Stats - TEMPORALMENTE COMENTADO */}
      {/* 
      {categoryStats.some(cat => cat.spent > 0) && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold">Categorías más usadas</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gold-400 hover:text-gold-400 hover:bg-gold-500/10 rounded-md px-2 py-1"
              onClick={() => navigate('/statistics')}
            >
              Ver todas
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {categoryStats.slice(0, 4).map((category, index) => (
              <Card 
                key={category.id} 
                className="bg-gradient-to-br from-gray-800/80 to-gray-700/50 border border-gray-600/50 p-4 relative overflow-hidden group hover:from-gray-700/80 hover:to-gray-600/50 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 ${category.color} rounded-full flex items-center justify-center text-sm shadow-lg transform transition-transform duration-200 group-hover:scale-110`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{category.name}</p>
                    <p className="text-gray-300 text-xs font-medium">
                      ${(category.spent || 0).toFixed(0)} gastado
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-600/30 rounded-full h-2 mb-3 overflow-hidden">
                  <div 
                    className={`h-2 ${category.color} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                    style={{ 
                      width: `${((category.spent || 0) / totalExpenses * 100)}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {category.transactionCount} {category.transactionCount === 1 ? 'transacción' : 'transacciones'}
                  </span>
                  <span className="text-xs text-white font-medium">
                    {((category.spent || 0) / totalExpenses * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              </Card>
            ))}
          </div>
        </div>
      )}
      */}

      {/* Transacciones recientes */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-gold-400" />
            Transacciones recientes
          </h3>
          {realTransactions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gold-500 hover:text-gold-500 hover:bg-gold-500/10 text-xs sm:text-sm rounded-md px-2 py-1"
              onClick={() => navigate('/statistics')}
            >
              Ver todas
            </Button>
          )}
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {realTransactions.length > 0 ? (
            (realTransactions as TransactionWithToken[]).slice(0, 5).map((tx, idx) => {
              // Icono según token
              let icon = '💰';
              if (!tx.isUSDC) icon = '💱';
              else if (tx.type === 'expense') icon = '💸';
              // Monto seguro
              const amount = (typeof tx.amount === 'number' && !isNaN(tx.amount)) ? tx.amount : 0;
              // Color
              const amountColor = !tx.isUSDC ? 'text-gold-500' : (tx.type === 'expense' ? 'text-gold-500' : 'text-gold-400');
              const bgColor = !tx.isUSDC ? 'bg-gold-500/20' : (tx.type === 'expense' ? 'bg-gold-500/20' : 'bg-gold-500/20');
              // Símbolo
              const symbol = tx.tokenSymbol || tx.currency || 'USDC';
              // Fecha
              let dateStr = '-';
              if (tx.date instanceof Date && !isNaN(tx.date.getTime())) {
                const now = new Date();
                const diffMs = now.getTime() - tx.date.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                
                if (diffDays === 0) {
                  if (diffHours === 0) dateStr = 'Hace un momento';
                  else dateStr = `Hace ${diffHours}h`;
                } else if (diffDays === 1) {
                  dateStr = 'Ayer';
                } else {
                  dateStr = `Hace ${diffDays}d`;
                }
              }
              return (
                <Card key={idx} className={`bg-black/30 border ${bgColor.replace('bg-', 'border-').replace('/20', '/30')} p-4 hover:border-opacity-60 transition-all group`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300 flex-shrink-0`}>
                        <span className="text-white text-xl sm:text-2xl">{icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm sm:text-base truncate">{tx.description || 'Transacción'}</p>
                        <p className="text-gray-300 text-xs sm:text-sm flex items-center space-x-2 mt-1">
                          <span>{tx.type === 'expense' ? 'Gasto' : 'Depósito'}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </p>
                        {!tx.isUSDC && (
                          <Badge className="mt-1 bg-gold-500/30 border-gold-400/50 text-gold-400 text-xs">
                            {symbol}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className={`text-lg sm:text-xl font-bold ${amountColor} group-hover:scale-110 transition-transform duration-300`}>
                        {tx.type === 'expense' ? '-' : '+'}${amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{symbol}</div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="bg-black/30 border border-gold-500/20 p-6 sm:p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-gold-500/20 border-2 border-gold-500/40 rounded-2xl flex items-center justify-center p-2">
                  <img src="/PumaPay.png" alt="PumaPay" className="h-10 w-10 object-contain" />
                </div>
              </div>
              <p className="text-white font-semibold text-lg mb-1">Bienvenido a PumaPay</p>
              <p className="text-gray-400 text-sm mb-6">Envía o recibe tu primer pago</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button type="button" onClick={() => navigate('/send')} className="bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
                <Button type="button" onClick={() => navigate('/receive')} className="bg-positive-600 hover:bg-positive-500 text-white font-semibold rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Recibir
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Leaderboard Top 50 */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold-400" />
            Ranking del campus
          </h3>
          <span className="text-xs text-gray-500">Top 50 por puntos</span>
        </div>
        <Card className="bg-black/30 border-2 border-gold-500/20 overflow-hidden hover:border-gold-500/40 transition-all">
          {leaderboardLoading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Cargando ranking…</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Aún no hay puntos. Completa cuestionarios en Guías de estudio para aparecer en el ranking.
            </div>
          ) : (
            <ul className="divide-y divide-white/10 max-h-[320px] overflow-y-auto">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = (user?.email || user?.address) === entry.user_email;
                const mask = entry.user_email.includes('@')
                  ? entry.user_email.slice(0, 2) + '***' + entry.user_email.slice(entry.user_email.indexOf('@'))
                  : entry.user_email.slice(0, 6) + '***';
                const position = index + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;
                return (
                  <li
                    key={entry.user_email}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${isCurrentUser ? 'bg-gold-500/15 border-l-2 border-gold-500' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 w-7 text-center font-bold text-gray-400">
                        {medal ?? position}
                      </span>
                      <span className={`truncate ${isCurrentUser ? 'text-gold-300 font-medium' : 'text-white'}`} title={isCurrentUser ? 'Tú' : undefined}>
                        {isCurrentUser ? 'Tú' : mask}
                      </span>
                    </div>
                    <span className="flex-shrink-0 text-gold-400 font-semibold ml-2">
                      {entry.total_points.toLocaleString()} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {!funded && (
        <div className="my-6 flex flex-col items-center px-4">
          <Button
            type="button"
            onClick={handleFundAccount}
            disabled={fundingLoading}
            className="bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-60"
          >
            {fundingLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Fondeando…
              </span>
            ) : (
              '💰 Fondear testnet (10,000 XLM)'
            )}
          </Button>
          {fundingMsg && (
            <p className="mt-2 text-gray-400 text-center text-sm">{fundingMsg}</p>
          )}
        </div>
      )}

      {/* Modal de animación de éxito del fondeo */}
      {showFundingSuccess && (
        <Dialog open={showFundingSuccess} onOpenChange={setShowFundingSuccess}>
          <DialogContent className="bg-[#0a0a0a] border-2 border-gold-500/30 text-white p-0 overflow-hidden max-w-md">
            <div className="relative p-8 text-center">
              {/* Confetti animation */}
              {showFundingAnimation && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: `${1 + Math.random() * 1}s`,
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-gold-300" />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Contenido principal */}
              <div className="relative z-10">
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gold-400 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-gold-500 rounded-full p-6 animate-pulse">
                      <Zap className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold mb-2 animate-bounce">¡Cuenta Fondeada!</h2>
                <p className="text-lg mb-4 text-zinc-200">
                  Has recibido <span className="font-bold text-gold-300 text-2xl">10,000 XLM</span>
                </p>
                
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-gold-400" />
                    <span className="text-sm">Fondeo exitoso en testnet</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-gold-400" />
                    <span className="text-sm">10,000 XLM disponibles</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={() => setShowFundingSuccess(false)}
                    className="bg-white text-black hover:bg-gray-100 font-bold py-2 px-6 rounded-full"
                  >
                    ¡Genial!
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <BottomNav />
    </div>
  );
};

export default HomePage;


