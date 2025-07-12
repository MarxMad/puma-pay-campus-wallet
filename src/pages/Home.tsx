import { useState, useEffect } from 'react';
import { Bell, Home, Search, Settings, User, ArrowUp, ArrowDown, ArrowLeftRight, Eye, EyeOff, TrendingUp, TrendingDown, Plus, Banknote, BarChart3, Send, Download, Repeat, Zap, Sparkles, Activity, MapPin, QrCode, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Tag, CheckCircle, XCircle, Loader2, Star, StarHalf, StarOff, Info, AlertTriangle, ShieldCheck, Gift, Trophy, GraduationCap, Users, Globe, Calendar, FileText, FilePlus, FileMinus, FileCheck, FileX, File, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { bitsoService } from '@/services/bitso';
import { portalService } from '@/services/portal';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';
import { SkeletonBalance } from '../components/SkeletonLoader';
import { BottomNav } from '@/components/BottomNav';
import { junoService } from '@/services/junoService';

// Extensión temporal del tipo Transaction para props extra de portalService
type TransactionWithToken = import('@/types/categories').Transaction & { isMXNB?: boolean; tokenSymbol?: string };

const HomePage = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusMsg, setBonusMsg] = useState('');

  useEffect(() => {
    setBonusClaimed(localStorage.getItem('pumapay_bonus_claimed') === 'true');
  }, []);

  const handleClaimBonus = async () => {
    console.log('user:', user);
    if (!user?.address || !user?.clabe || !user?.name) {
      alert('No se encontró tu dirección de wallet o CLABE.');
          return;
        }
    setBonusLoading(true);
    setBonusMsg('Procesando bonus… puede tardar un momento en reflejarse en tu wallet.');
    try {
      // 1. Mock deposit a la CLABE del usuario
      await junoService.createMockDeposit({
        amount: 500,
        receiver_clabe: user.clabe,
        receiver_name: user.name,
        sender_name: user.name
      });
      // 2. Withdrawal a la wallet del usuario
      await junoService.sendOnchainWithdrawal({
        address: user.address,
        amount: 500,
        asset: 'MXNB',
        blockchain: 'ARBITRUM',
        compliance: {}
      });
      setBonusMsg('¡Bonus de bienvenida enviado a tu wallet! Puede tardar unos segundos en reflejarse.');
      window.dispatchEvent(new CustomEvent('forceBalanceUpdate'));
    } catch (e) {
      setBonusMsg('Error al reclamar el bonus. Intenta nuevamente.');
    } finally {
      setBonusLoading(false);
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

  // Hook de balance para obtener balance real del usuario
  const { available, isLoading: balanceLoading, recalculateBalance } = useBalance();

  // Solo recalcula balance al montar y cuando se detecta una transacción enviada o recibida
  useEffect(() => {
    const handleUpdate = () => {
      if (recalculateBalance) {
        recalculateBalance();
      }
    };
    // Al montar
    handleUpdate();
    // Al recibir eventos relevantes
    window.addEventListener('transactionAdded', handleUpdate);
    window.addEventListener('forceBalanceUpdate', handleUpdate);
    return () => {
      window.removeEventListener('transactionAdded', handleUpdate);
      window.removeEventListener('forceBalanceUpdate', handleUpdate);
    };
  }, []);

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
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg p-1">
          <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center shadow-inner">
            <img src="/PumaPay.png" alt="PumaPay" className="h-5 w-5 object-contain" />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Wallet Info */}
      <div className="p-4">
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white mb-6">
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
          {user?.clabe && (
            <div className="bg-green-100 p-4 rounded-lg mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-green-900">Tu CLABE para depósitos:</div>
                <div className="font-mono text-2xl text-green-800 select-all tracking-widest" style={{ letterSpacing: '0.1em' }}>{user?.clabe}</div>
                <div className="text-green-900 text-sm mt-1">Deposita MXN a esta CLABE desde cualquier banco para fondear tu wallet PumaPay. Cada depósito se convertirá automáticamente en MXNB.</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {navigator.clipboard.writeText(user?.clabe || ''); alert('CLABE copiada al portapapeles')}}
                className="ml-2 text-green-700 hover:text-green-900"
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
                  2. Juno detecta el depósito y automáticamente convierte los MXN en MXNB.<br />
                  3. Tu balance de MXNB se actualiza en PumaPay y puedes usarlo en el campus.
                </div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="font-semibold text-green-800 mb-1">¿Cómo funciona el retiro?</div>
                <div className="text-xs text-green-700">
                  1. Enlaza tu cuenta bancaria personal (CLABE) en tu perfil.<br />
                  2. Solicita un retiro/redemption desde la app.<br />
                  3. Juno convierte tus MXNB a MXN y los transfiere a tu cuenta bancaria.
                </div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <span className="text-gray-300 text-sm">Balance MXNB</span>
            <div className="text-3xl font-bold mt-1">
              {typeof available === 'number' && !isNaN(available)
                ? `$${available.toFixed(2)}`
                : 'Cargando...'}
            </div>
          </div>
        </Card>
      </div>

      {/* Balance Card */}
      <div className="p-4 overflow-hidden">
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white relative overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-gray-300 text-sm">Saldo disponible</span>
              {totalExpenses > 0 && (
              <div className="flex items-center space-x-2 mt-1">
                  <span className="text-gray-400 text-xs">
                    Gastado este mes: ${totalExpenses.toFixed(2)}
                </span>
              </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="text-gray-300 hover:text-white"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {balanceLoading ? (
            <SkeletonBalance />
          ) : (
            <div className="text-4xl font-bold mb-6 transform transition-all duration-300 ease-out hover:brightness-110 hover:text-shadow-glow">
              {showBalance ? `$${available.toFixed(2)}` : '••••••'}
                <span className="text-lg text-gray-400 ml-2">MXNB</span>
            </div>
            )}
          
          {/* Weekly Chart */}
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
                    {/* Tooltip */}
                    {isHovered && day.amount > 0 && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
                        <div className="text-white font-semibold">${day.amount.toFixed(2)}</div>
                        <div className="text-gray-400">{isToday ? 'Hoy' : day.day}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                    
                    {/* Bar */}
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
                          {/* Animated shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Glow effect for today */}
                          {isToday && (
                            <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-pulse"></div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-2 bg-gray-600/50 rounded-lg absolute bottom-0 opacity-50"></div>
                      )}
                      
                      {/* Today indicator */}
                      {isToday && (
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* Day Label */}
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
            
            {/* Week summary */}
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

          {/* Background decoration */}
          <div className="absolute top-4 right-4 opacity-10">
            <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">₱</span>
            </div>
          </div>
        </Card>
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
                    <span className="text-blue-400">6 lugares disponibles</span>
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

      {/* Spending Overview */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Gastos del mes */}
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
            
            {/* Progress indicator */}
            {monthlyGoalProgress > 0 && (
              <div className="mt-2 w-full bg-orange-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(monthlyGoalProgress, 100)}%` }}
                ></div>
              </div>
            )}
            
            {/* Background decoration */}
                          <div className="absolute -top-3 -right-3 w-12 h-12 bg-orange-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </Card>
          
          {/* Meta mensual */}
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
            
            {/* Progress circle */}
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
            
            {/* Background decoration */}
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </Card>
        </div>
      </div>

      {/* Category Stats - Solo mostrar si hay gastos */}
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
                
                {/* Progress bar */}
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
                
                {/* Background decoration */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Transacciones recientes</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-orange-400 hover:text-orange-300"
            onClick={() => navigate('/statistics')}
          >
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-3">
          {realTransactions.length > 0 ? (
            (realTransactions as TransactionWithToken[]).map((tx, idx) => {
              // Icono según token
              let icon = '💰';
              if (!tx.isMXNB) icon = '💱';
              else if (tx.type === 'expense') icon = '💸';
              // Monto seguro
              const amount = (typeof tx.amount === 'number' && !isNaN(tx.amount)) ? tx.amount : 0;
              // Color
              const amountColor = !tx.isMXNB ? 'text-blue-400' : (tx.type === 'expense' ? 'text-red-400' : 'text-green-400');
              // Símbolo
              const symbol = tx.tokenSymbol || tx.currency || 'MXNB';
              // Fecha
              let dateStr = '-';
              if (tx.date instanceof Date && !isNaN(tx.date.getTime())) {
                dateStr = tx.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              }
              return (
                <Card key={idx} className="bg-gray-800 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center`}>
                        <span className="text-white text-lg">{icon}</span>
                  </div>
                  <div>
                        <p className="text-white font-medium text-sm">{tx.description || 'Transacción'}</p>
                        <p className="text-gray-400 text-xs">{tx.type === 'expense' ? 'Gasto' : 'Depósito'} • {dateStr}</p>
                        {/* Mostrar hash real si existe */}
                        {tx.txHash && (
                          <div className="text-xs text-gray-400 break-all mt-1">
                            <span className="font-mono">Hash:</span> {tx.txHash}
                          </div>
                        )}
                        {/* Mostrar símbolo si no es MXNB */}
                        {!tx.isMXNB && (
                          <div className="text-xs text-blue-400 mt-1">Token: {symbol}</div>
                      )}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${amountColor}`}>{tx.type === 'expense' ? '-' : '+'}${amount.toFixed(2)} {symbol}</div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="bg-gray-800 border-gray-700 p-6 text-center">
              <div className="text-gray-400 mb-2">
                <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                </div>
              <p className="text-gray-400 text-sm mb-1">¡Bienvenido a PumaPay Campus!</p>
              <p className="text-gray-500 text-xs mb-4">Inicia enviando o recibiendo tu primer pago</p>
              <div className="flex space-x-3 justify-center">
                <Button onClick={() => navigate('/send')} size="sm" className="bg-orange-500 hover:bg-orange-600">Enviar dinero</Button>
                <Button onClick={() => navigate('/receive')} size="sm" className="bg-green-500 hover:bg-green-600">Recibir dinero</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mostrar botón de bonus siempre para pruebas */}
      <div className="my-4 flex flex-col items-center justify-center">
        <button
          onClick={handleClaimBonus}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-lg animate-bounce disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={bonusLoading}
        >
          {bonusLoading ? (
            <span className="flex items-center"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>Procesando…</span>
          ) : (
            '🎁 Reclamar bonus de bienvenida (+500 MXNB)'
          )}
        </button>
        {bonusMsg && (
          <div className="mt-3 text-green-200 text-center text-sm animate-pulse">{bonusMsg}</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;

