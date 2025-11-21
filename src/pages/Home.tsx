import { useState, useEffect } from 'react';
import { Bell, Home, Search, Settings, User, ArrowUp, ArrowDown, ArrowLeftRight, Eye, EyeOff, TrendingUp, TrendingDown, Plus, Banknote, BarChart3, Send, Download, Repeat, Zap, Sparkles, Activity, MapPin, QrCode, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Tag, CheckCircle, XCircle, Loader2, Star, StarHalf, StarOff, Info, AlertTriangle, ShieldCheck, Gift, Trophy, GraduationCap, Users, Globe, Calendar, FileText, FilePlus, FileMinus, FileCheck, FileX, File, Copy, RefreshCw, PartyPopper, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
// ⚠️ COMENTADO - Ahora usamos Stellar
// import { bitsoService } from '@/services/bitso';
// import { portalService } from '@/services/portal';
// import { junoService } from '@/services/junoService';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';
import { SkeletonBalance } from '../components/SkeletonLoader';
import { BottomNav } from '@/components/BottomNav';
import { stellarService } from '@/services/stellarService';

// Extensión temporal del tipo Transaction para props extra de portalService
type TransactionWithToken = import('@/types/categories').Transaction & { isUSDC?: boolean; tokenSymbol?: string };

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

  useEffect(() => {
    // Verificar si la cuenta ya fue fondeada
    const fundedKey = `pumapay_funded_${user?.address}`;
    setFunded(localStorage.getItem(fundedKey) === 'true');
  }, [user?.address]);

  const handleFundAccount = async () => {
    console.log('💰 Iniciando fondeo de cuenta Stellar:', user);
    
    if (!user?.address) {
      alert('No se encontró tu dirección de wallet. Completa tu registro primero.');
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
      setFundingMsg(`Error al fondear cuenta: ${error.message || 'Intenta nuevamente.'}`);
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
    {
      icon: Target,
      label: 'Metas',
      action: () => navigate('/savings-goals'),
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    },
    { icon: Send, label: 'Enviar', color: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600', action: () => navigate('/send') },
    { icon: Download, label: 'Recibir', color: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600', action: () => navigate('/receive') },
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
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-black/30">
        <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
          <User className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 border border-orange-500/30 rounded-full flex items-center justify-center shadow-lg p-1.5">
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-inner border border-gray-600/50">
              <img src="/PumaPay.png" alt="PumaPay" className="h-8 w-8 object-contain brightness-110 rounded-full" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-white">
              PumaPay
            </h1>
            <p className="text-xs text-gray-400">Campus Wallet</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Wallet Info */}
      <div className="p-4">
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white mb-6 relative overflow-hidden">
          {/* Logo decorativo en el fondo */}
          <div className="absolute top-4 right-4 opacity-5">
            <img src="/PumaPay.png" alt="PumaPay" className="h-32 w-32 object-contain" />
          </div>
          <div className="relative z-10">
            {/* Logo principal */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 border border-orange-500/30 rounded-2xl flex items-center justify-center shadow-lg p-2">
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center shadow-inner border border-gray-600/50">
                  <img src="/PumaPay.png" alt="PumaPay" className="h-10 w-10 object-contain brightness-110 rounded-xl" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  PumaPay Wallet
                </h2>
                <p className="text-xs text-gray-400">Tu wallet estudiantil</p>
              </div>
            </div>
            <div className="mb-2">
              <span className="text-gray-300 text-sm">Dirección de wallet</span>
              <div className="flex items-center space-x-2 font-mono text-green-400 text-xs break-all mt-1">
                <span>{user?.address}</span>
                {user?.address && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(user.address);
                      alert('¡Dirección copiada!');
                    }}
                    title="Copiar dirección"
                  >
                    <Copy className="w-4 h-4" />
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
                <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-2">
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
            <div className="mt-4">
              <span className="text-gray-300 text-sm">Balance {assetSymbol || 'USDC'}</span>
              <div className="text-3xl font-bold mt-1">
                {typeof available === 'number' && !isNaN(available)
                  ? `$${available.toFixed(2)}`
                  : 'Cargando...'}
              </div>
            </div>
          </div>
        </Card>
      </div>

          {/* Balance Card */}
      <div className="p-4 overflow-hidden">
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white relative overflow-hidden shadow-2xl shadow-black/40">
          {/* Logo decorativo en el fondo del balance */}
          <div className="absolute bottom-4 right-4 opacity-5">
            <img src="/PumaPay.png" alt="PumaPay" className="h-40 w-40 object-contain" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-sm">Saldo disponible</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Balance actualizado desde blockchain"></div>
                  <span className="text-xs text-green-400 font-medium">Blockchain</span>
                </div>
              </div>
              {lastBalanceUpdate && (
                <span className="text-xs text-gray-500 mt-1 block">
                  Actualizado: {lastBalanceUpdate.toLocaleTimeString('es-MX')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={async () => {
                  setIsRefreshing(true);
                  await refreshBalance();
                  setLastBalanceUpdate(new Date());
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing || balanceLoading}
                className="text-gray-300 hover:text-white"
                title="Actualizar balance desde blockchain"
              >
                {isRefreshing || balanceLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-300 hover:text-white"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {balanceLoading || isRefreshing ? (
            <SkeletonBalance />
          ) : (
            <div className="space-y-2">
              <div className="text-4xl font-bold transform transition-all duration-300 ease-out hover:brightness-110 hover:text-shadow-glow">
                {showBalance ? (
                  <>
                    ${available.toFixed(2)}
                    <span className="text-lg text-gray-400 ml-2">{assetSymbol || 'USDC'}</span>
                  </>
                ) : (
                  '••••••'
                )}
              </div>
              {showBalance && available === 0 && (
                <p className="text-sm text-gray-400">
                  Tu wallet está lista. Recibe USDC para empezar a usar PumaPay.
                </p>
              )}
            </div>
          )}
          
          {/* Weekly Chart - TEMPORALMENTE COMENTADO */}
          {/* 
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300 font-medium">Gastos de la semana</span>
              <div className="flex-1"></div>
              {weeklySpending.some(d => d.amount > 0) && (
                <span className="text-xs text-gray-400">
                  Total: ${weeklySpending.reduce((sum, d) => sum + d.amount, 0).toFixed(0)}
                </span>
              )}
            </div>
            
            <div className="h-24 flex items-end justify-between space-x-3 px-2">
              {weeklySpending.map((day, i) => {
                const maxAmount = Math.max(...weeklySpending.map(d => d.amount), 100);
                const heightPercentage = day.amount > 0 ? Math.max((day.amount / maxAmount) * 100, 6) : 6;
                const isHovered = hoveredDay === i;
                const isToday = day.day === ['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date().getDay()];
                
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center space-y-2 flex-1 relative cursor-pointer"
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className="w-full bg-gray-700/30 rounded-lg relative overflow-hidden" style={{ height: '70px' }}>
                      {day.amount > 0 ? (
                        <div 
                          className={`w-full absolute bottom-0 rounded-lg transition-all duration-500 ease-out transform ${
                            isHovered ? 'scale-110' : 'scale-100'
                          } ${
                            isToday 
                              ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400' 
                              : 'bg-gradient-to-t from-red-600 via-red-500 to-red-400'
                          }`}
                          style={{ 
                            height: `${heightPercentage}%`,
                            animationDelay: `${i * 100}ms`,
                            boxShadow: isHovered ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          {isToday && (
                            <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-pulse"></div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-2 bg-gray-600/50 rounded-lg absolute bottom-0 opacity-50"></div>
                      )}
                      {isToday && (
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <span className={`text-xs transition-all duration-200 ${
                      isToday 
                        ? 'text-blue-400 font-bold' 
                        : isHovered 
                          ? 'text-orange-400 font-semibold' 
                          : 'text-gray-400'
                    }`}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {weeklySpending.some(d => d.amount > 0) ? (
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Hoy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Otros días</span>
                </div>
                <div>
                  Promedio: ${(weeklySpending.reduce((sum, d) => sum + d.amount, 0) / 7).toFixed(0)}/día
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">No hay gastos esta semana</p>
              </div>
            )}
          </div>
          */}
          
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg border border-orange-500/30 p-4 relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg shadow-orange-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs font-medium">Gastos del mes</p>
                  <p className="text-white font-bold text-lg truncate">${totalExpenses.toFixed(2)}</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </Card>

            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg border border-green-500/30 p-4 relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg shadow-green-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs font-medium">Ingresos del mes</p>
                  <p className="text-white font-bold text-lg truncate">${totalIncome.toFixed(2)}</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </Card>
          </div>

          {/* Gráfico de gastos semanales */}
          {weeklySpending.some(d => d.amount > 0) && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-300 font-medium">Gastos de la semana</span>
                <div className="flex-1"></div>
                <span className="text-xs text-gray-400 font-semibold">
                  Total: ${weeklySpending.reduce((sum, d) => sum + d.amount, 0).toFixed(0)}
                </span>
              </div>
              
              <div className="h-28 flex items-end justify-between space-x-2 px-1">
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
                      <div className="w-full bg-gray-700/30 rounded-lg relative overflow-hidden" style={{ height: '80px' }}>
                        {day.amount > 0 ? (
                          <div 
                            className={`w-full absolute bottom-0 rounded-lg transition-all duration-500 ease-out transform ${
                              isHovered ? 'scale-110' : 'scale-100'
                            } ${
                              isToday 
                                ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400' 
                                : 'bg-gradient-to-t from-orange-600 via-orange-500 to-orange-400'
                            }`}
                            style={{ 
                              height: `${heightPercentage}%`,
                              animationDelay: `${i * 100}ms`,
                              boxShadow: isHovered ? (isToday ? '0 0 20px rgba(59, 130, 246, 0.6)' : '0 0 20px rgba(249, 115, 22, 0.6)') : 'none'
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000"></div>
                            {isToday && (
                              <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-pulse"></div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-2 bg-gray-600/50 rounded-lg absolute bottom-0 opacity-50"></div>
                        )}
                        {isToday && (
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-center">
                        <span className={`text-xs font-semibold block transition-all duration-200 ${
                          isToday 
                            ? 'text-blue-400' 
                            : isHovered 
                              ? 'text-orange-400' 
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
              
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Hoy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Otros días</span>
                </div>
                <div className="text-gray-300 font-medium">
                  Promedio: ${(weeklySpending.reduce((sum, d) => sum + d.amount, 0) / 7).toFixed(0)}/día
                </div>
              </div>
            </div>
          )}

          {/* Acciones rápidas: Enviar y Recibir */}
          <div className="flex justify-center items-center gap-6 my-8">
            {quickActions.map((action, index) => (
              <Button 
                key={index}
                onClick={action.action}
                className={`${action.color} text-white p-6 rounded-2xl flex flex-col items-center space-y-2 h-auto transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 group relative overflow-hidden min-w-[120px]`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-700 ease-out"></div>
                <action.icon className="h-8 w-8 relative z-10 transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span className="text-base font-medium relative z-10 group-hover:text-shadow-glow">{action.label}</span>
                <div className="absolute top-1 right-1 w-2 h-2 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors duration-300"></div>
              </Button>
            ))}
          </div>

          </div>
          {/* Background decoration con logo */}
          <div className="absolute top-4 right-4 opacity-5">
            <div className="w-20 h-20 border-2 border-gray-600/30 rounded-full flex items-center justify-center bg-gray-800/20">
              <img src="/PumaPay.png" alt="PumaPay" className="h-12 w-12 object-contain brightness-75" />
            </div>
          </div>
        </Card>
      </div>

      {/* Logros y Badges */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span>Logros</span>
          </h3>
          <Badge className="bg-yellow-500/20 border-yellow-400/50 text-yellow-300">
            {realTransactions.length} transacciones
          </Badge>
        </div>
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg border border-yellow-500/30 p-4 min-w-[140px] flex-shrink-0 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                <Star className="h-6 w-6 text-white fill-white" />
              </div>
              <p className="text-white font-semibold text-sm">Primer pago</p>
              <p className="text-yellow-300 text-xs mt-1">
                {realTransactions.length > 0 ? '✓ Completado' : 'En progreso'}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg border border-blue-500/30 p-4 min-w-[140px] flex-shrink-0 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <p className="text-white font-semibold text-sm">Usuario activo</p>
              <p className="text-blue-300 text-xs mt-1">
                {realTransactions.length >= 5 ? '✓ Completado' : `${realTransactions.length}/5`}
              </p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg border border-green-500/30 p-4 min-w-[140px] flex-shrink-0 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                <Banknote className="h-6 w-6 text-white" />
              </div>
              <p className="text-white font-semibold text-sm">Ahorrador</p>
              <p className="text-green-300 text-xs mt-1">
                {available >= 500 ? '✓ Completado' : 'En progreso'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Promociones del Campus */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-orange-400" />
            <span>Promociones del Campus</span>
          </h3>
          <div className="flex items-center space-x-1 text-orange-400">
            <span className="text-sm font-medium">Descuentos exclusivos</span>
          </div>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Cafetería Las Islas */}
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border-orange-500/30 p-4 min-w-[280px] flex-shrink-0 relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gray-900/50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm">🍽️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white drop-shadow-md">Cafetería Las Islas</h4>
                    <p className="text-xs text-white/90 font-medium">Comida</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-orange-600 rounded-full px-2 py-1 shadow-md">
                    <span className="text-xs font-bold text-white">-20%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Chilaquiles con pollo</span>
                  <span className="font-bold text-orange-200 drop-shadow-lg">75 USDC</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Café americano</span>
                  <span className="font-bold text-orange-200 drop-shadow-lg">25 USDC</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-orange-500/20 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          </Card>

          {/* Café y Cuernito */}
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border-yellow-500/30 p-4 min-w-[280px] flex-shrink-0 relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gray-900/50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm">☕</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white drop-shadow-md">Café y Cuernito</h4>
                    <p className="text-xs text-white/90 font-medium">Café</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-yellow-600 rounded-full px-2 py-1 shadow-md">
                    <span className="text-xs font-bold text-white">-15%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Café especial</span>
                  <span className="font-bold text-yellow-200 drop-shadow-lg">80 USDC</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Jugo de naranja</span>
                  <span className="font-bold text-yellow-200 drop-shadow-lg">25 USDC</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-500/20 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          </Card>

          {/* Librería Central */}
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border-blue-500/30 p-4 min-w-[280px] flex-shrink-0 relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gray-900/50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm">📚</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white drop-shadow-md">Librería Central</h4>
                    <p className="text-xs text-white/90 font-medium">Libros</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-blue-600 rounded-full px-2 py-1 shadow-md">
                    <span className="text-xs font-bold text-white">-10%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Álgebra Lineal</span>
                  <span className="font-bold text-blue-200 drop-shadow-lg">120 USDC</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Cálculo Diferencial</span>
                  <span className="font-bold text-blue-200 drop-shadow-lg">95 USDC</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-blue-500/20 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          </Card>

          {/* Gimnasio */}
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border-green-500/30 p-4 min-w-[280px] flex-shrink-0 relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gray-900/50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm">🏃‍♂️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white drop-shadow-md">Gimnasio Central</h4>
                    <p className="text-xs text-white/90 font-medium">Deportes</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-green-600 rounded-full px-2 py-1 shadow-md">
                    <span className="text-xs font-bold text-white">-25%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Membresía mensual</span>
                  <span className="font-bold text-green-200 drop-shadow-lg">200 USDC</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white font-medium">Clase de natación</span>
                  <span className="font-bold text-green-200 drop-shadow-lg">50 USDC</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500/20 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          </Card>
        </div>
      </div>

      {/* Campus Map Feature */}
      <div className="px-4 mb-6">
        <Card 
          className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white relative overflow-hidden group hover:bg-gray-800/70 transition-all duration-500 shadow-2xl cursor-pointer"
          onClick={() => navigate('/campus-map')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">🗺️ Descubre el Campus</h3>
                <p className="text-gray-300 text-sm">
                  Encuentra lugares que aceptan PumaPay
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">Descuentos exclusivos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-400">20+ lugares disponibles</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1 mb-2">
                <span className="text-green-400 text-xs font-bold">¡NUEVO!</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-300">
                <span className="text-sm">Ver mapa</span>
                <ArrowUp className="h-4 w-4 rotate-45" />
              </div>
            </div>
          </div>
          
          {/* Popular places preview */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-xs text-gray-400">Populares:</span>
            <div className="flex items-center space-x-1">
              <span className="text-lg">🍕</span>
              <span className="text-xs text-white">Cafetería</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg">🏃‍♂️</span>
              <span className="text-xs text-white">Gimnasio</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg">📚</span>
              <span className="text-xs text-white">Librería</span>
            </div>
          </div>
          
          {/* Animated background effects */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute top-1/2 right-12 w-6 h-6 bg-gray-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        </Card>
      </div>

      {/* Spending Overview - TEMPORALMENTE COMENTADO */}
      {/* 
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-orange-500/20 backdrop-blur-lg border border-orange-500/30 p-5 relative overflow-hidden group hover:bg-orange-500/30 transition-all duration-300 shadow-lg shadow-orange-500/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Gastos del mes</p>
                <p className="text-white font-bold text-xl">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
            
            {monthlyGoalProgress > 0 && (
              <div className="mt-2 w-full bg-orange-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(monthlyGoalProgress, 100)}%` }}
                ></div>
              </div>
            )}
            
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-orange-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </Card>
          
          <Card className="bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 p-5 relative overflow-hidden group hover:bg-blue-500/30 transition-all duration-300 shadow-lg shadow-blue-500/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
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
            
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
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
              variant="ghost" 
              size="sm" 
              className="text-orange-400 hover:text-orange-300"
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

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <span>Transacciones recientes</span>
          </h3>
          {realTransactions.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-400 hover:text-orange-300"
              onClick={() => navigate('/statistics')}
            >
              Ver todas
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {realTransactions.length > 0 ? (
            (realTransactions as TransactionWithToken[]).slice(0, 5).map((tx, idx) => {
              // Icono según token
              let icon = '💰';
              if (!tx.isUSDC) icon = '💱';
              else if (tx.type === 'expense') icon = '💸';
              // Monto seguro
              const amount = (typeof tx.amount === 'number' && !isNaN(tx.amount)) ? tx.amount : 0;
              // Color
              const amountColor = !tx.isUSDC ? 'text-blue-400' : (tx.type === 'expense' ? 'text-red-400' : 'text-green-400');
              const bgColor = !tx.isUSDC ? 'bg-blue-500/20' : (tx.type === 'expense' ? 'bg-red-500/20' : 'bg-green-500/20');
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
                <Card key={idx} className={`${bgColor} border-gray-700/50 p-4 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                        <span className="text-white text-xl">{icon}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{tx.description || 'Transacción'}</p>
                        <p className="text-gray-300 text-xs flex items-center space-x-2 mt-1">
                          <span>{tx.type === 'expense' ? 'Gasto' : 'Depósito'}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </p>
                        {!tx.isUSDC && (
                          <Badge className="mt-1 bg-blue-500/30 border-blue-400/50 text-blue-300 text-xs">
                            {symbol}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${amountColor} group-hover:scale-110 transition-transform duration-300`}>
                        {tx.type === 'expense' ? '-' : '+'}${amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{symbol}</div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-green-500/5"></div>
              <div className="absolute top-4 right-4 opacity-5">
                <img src="/PumaPay.png" alt="PumaPay" className="h-32 w-32 object-contain" />
              </div>
              <div className="relative z-10">
                {/* Logo grande en el centro */}
                <div className="mb-6 flex justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/30 rounded-3xl flex items-center justify-center shadow-2xl p-3">
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center shadow-inner border border-gray-600/50">
                      <img src="/PumaPay.png" alt="PumaPay" className="h-16 w-16 object-contain brightness-110 rounded-2xl" />
                    </div>
                  </div>
                </div>
                <p className="text-white font-semibold text-lg mb-2">¡Bienvenido a PumaPay Campus!</p>
                <p className="text-gray-400 text-sm mb-6">Inicia enviando o recibiendo tu primer pago</p>
                <div className="flex space-x-3 justify-center">
                  <Button 
                    onClick={() => navigate('/send')} 
                    size="sm" 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar dinero
                  </Button>
                  <Button 
                    onClick={() => navigate('/receive')} 
                    size="sm" 
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Recibir dinero
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Botón para fondear cuenta en testnet */}
      {!funded && (
        <div className="my-4 flex flex-col items-center justify-center px-4">
          <button
            onClick={handleFundAccount}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-lg disabled:opacity-60 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 active:scale-95"
            disabled={fundingLoading}
          >
            {fundingLoading ? (
              <span className="flex items-center"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>Fondeando…</span>
            ) : (
              '💰 Fondear en testnet (10,000 XLM)'
            )}
          </button>
          {fundingMsg && (
            <div className="mt-3 text-blue-200 text-center text-sm animate-pulse">{fundingMsg}</div>
          )}
        </div>
      )}

      {/* Modal de animación de éxito del fondeo */}
      {showFundingSuccess && (
        <Dialog open={showFundingSuccess} onOpenChange={setShowFundingSuccess}>
          <DialogContent className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 border-none text-white p-0 overflow-hidden max-w-md">
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
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Contenido principal */}
              <div className="relative z-10">
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-blue-500 rounded-full p-6 animate-pulse">
                      <Zap className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold mb-2 animate-bounce">¡Cuenta Fondeada!</h2>
                <p className="text-lg mb-4 text-blue-100">
                  Has recibido <span className="font-bold text-yellow-300 text-2xl">10,000 XLM</span>
                </p>
                
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-300" />
                    <span className="text-sm">Fondeo exitoso en testnet</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-300" />
                    <span className="text-sm">10,000 XLM disponibles</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
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

