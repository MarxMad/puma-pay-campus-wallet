import React, { useMemo, useState, useEffect } from 'react';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useBalance } from '@/hooks/useBalance';
import { BottomNav } from '@/components/BottomNav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  TrendingUp,
  Shield,
  Award,
  PiggyBank,
  Bell,
  ArrowLeft,
  Lock,
  Copy,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { ZKProofBadge, ZKProofInfo } from '@/components/ZKProofBadge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { defindexService } from '@/services/defindexService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const STELLAR_EXPLORER_BASE =
  (import.meta.env.VITE_STELLAR_NETWORK || 'testnet').toLowerCase() === 'mainnet'
    ? 'https://stellar.expert/explorer/public/tx/'
    : 'https://stellar.expert/explorer/testnet/tx/';

const goalFormSchema = z.object({
  targetAmount: z
    .number()
    .min(1, 'El monto debe ser mayor a 0')
    .positive('El monto debe ser positivo'),
  deadline: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

export const SavingsGoals: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    goals,
    isLoading,
    error,
    createGoal,
    deleteGoal,
    updateGoal,
    depositToGoal,
    getProgress,
    generateProof,
    claimReward,
  } = useSavingsGoals();
  const { balance } = useBalance();
  const [isCreating, setIsCreating] = useState(false);
  const [generatingProofId, setGeneratingProofId] = useState<string | null>(null);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);
  const [depositingGoalId, setDepositingGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [showDepositModal, setShowDepositModal] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txType, setTxType] = useState<'create' | 'deposit' | 'proof' | null>(null);
  const [copied, setCopied] = useState(false);
  const [defindexAPY, setDefindexAPY] = useState<number | null>(null);
  const [defindexBalance, setDefindexBalance] = useState<bigint | null>(null);
  const [defindexEarnings, setDefindexEarnings] = useState<number | null>(null);

  // Cargar APY y balance de DeFindex (con actualización periódica para mostrar rendimiento en tiempo real)
  useEffect(() => {
    const loadDefindexData = async () => {
      try {
        // Cargar APY
        const apyResult = await defindexService.getAPY();
        if (apyResult.apy > 0) {
          setDefindexAPY(apyResult.apy);
        }

        // Cargar balance y earnings si hay usuario
        if (user?.walletAddress || user?.address) {
          const balanceResult = await defindexService.getBalance(user?.walletAddress || user?.address || '');
          if (balanceResult.balance > 0n) {
            setDefindexBalance(balanceResult.balance);
          }
          if (balanceResult.earnings !== undefined) {
            setDefindexEarnings(balanceResult.earnings);
          }
        }
      } catch (error) {
        console.warn('Error cargando datos de DeFindex:', error);
      }
    };

    loadDefindexData();
    
    // Actualizar cada 5 segundos para mostrar el rendimiento en tiempo real
    const interval = setInterval(loadDefindexData, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      targetAmount: 0,
      deadline: '',
    },
  });

  const handleCreateGoal = async (values: GoalFormValues) => {
    setIsCreating(true);
    try {
      const deadline = values.deadline
        ? new Date(values.deadline)
        : undefined;

      console.log('🎯 handleCreateGoal - Llamando createGoal...');
      const result = await createGoal(values.targetAmount, deadline);
      console.log('📥 handleCreateGoal - Resultado recibido:', result);
      console.log('🔍 handleCreateGoal - ¿Tiene txHash?', !!(result as any)?.txHash);
      
      // Si hay txHash, mostrarlo en el dialog
      if ((result as any)?.txHash) {
        console.log('✅ handleCreateGoal - Configurando txHash:', (result as any).txHash);
        setTxHash((result as any).txHash);
        setTxType('create');
        console.log('✅ handleCreateGoal - txHash y txType configurados');
      } else {
        console.warn('⚠️ handleCreateGoal - No hay txHash en el resultado');
        toast({
          title: 'Meta creada',
          description: 'Tu meta de ahorro ha sido creada exitosamente.',
        });
      }
      form.reset();
    } catch (err: any) {
      console.error('❌ handleCreateGoal - Error:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo crear la meta',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta meta?')) {
      return;
    }

    try {
      await deleteGoal(goalId);
      toast({
        title: 'Meta eliminada',
        description: 'La meta ha sido eliminada exitosamente.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo eliminar la meta',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateProof = async (goalId: string) => {
    setGeneratingProofId(goalId);
    try {
      const result = await generateProof(goalId);
      // Si hay txHash, mostrarlo en el dialog
      if ((result as any)?.verificationTxHash) {
        setTxHash((result as any).verificationTxHash);
        setTxType('proof');
      } else {
        toast({
          title: 'Proof generado',
          description: 'El proof ZK ha sido generado exitosamente.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo generar el proof',
        variant: 'destructive',
      });
    } finally {
      setGeneratingProofId(null);
    }
  };

  const handleClaimReward = async (goalId: string) => {
    setClaimingRewardId(goalId);
    try {
      await claimReward(goalId);
      toast({
        title: 'Recompensa reclamada',
        description: 'Tu recompensa ha sido reclamada exitosamente.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo reclamar la recompensa',
        variant: 'destructive',
      });
    } finally {
      setClaimingRewardId(null);
    }
  };

  const handleDeposit = async (goalId: string) => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    setDepositingGoalId(goalId);
    try {
      const result = await depositToGoal(goalId, amount);
      // Si hay txHash, mostrarlo en el dialog
      if ((result as any)?.txHash) {
        setTxHash((result as any).txHash);
        setTxType('deposit');
      } else {
        toast({
          title: 'Depósito exitoso',
          description: `Se depositaron ${formatCurrency(amount)} en tu cajita de ahorro.`,
        });
      }
      setDepositAmount('');
      setShowDepositModal(null);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo depositar',
        variant: 'destructive',
      });
    } finally {
      setDepositingGoalId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const stats = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalProgress = goals.reduce((sum, g) => {
      const progress = getProgress(g.id);
      return sum + (progress?.currentBalance || 0);
    }, 0);
    const achieved = goals.filter((g) => g.achieved).length;
    return {
      totalTarget,
      totalProgress,
      achieved,
      active: goals.length - achieved,
    };
  }, [goals, getProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 pb-24 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-28 text-white">
      {/* Top nav */}
      <div className="flex items-center justify-between p-4 text-white bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-blue-400/40 p-2 sm:p-2.5">
            <img src="/PumaPay.png" alt="PumaPay" className="h-full w-full object-contain drop-shadow-lg rounded-2xl" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              PumaPay
            </p>
            <h1 className="text-lg font-bold">Metas de ahorro</h1>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
          <Bell className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero */}
        <Card className="bg-gray-800/70 border-white/10 text-white shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Balance disponible</p>
                <h2 className="text-3xl font-bold mt-1">
                  ${(balance.available || 0).toFixed(2)}
                  <span className="text-base text-blue-100 ml-2">USDC</span>
                </h2>
                {defindexAPY && (
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="h-4 w-4 text-yellow-400" />
                    <p className="text-sm text-yellow-400">
                      Generando {defindexAPY.toFixed(2)}% APY con DeFindex
                    </p>
                  </div>
                )}
                {defindexBalance && defindexBalance > 0n && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      En DeFindex: ${(Number(defindexBalance) / 10000000).toFixed(2)} XLM
                    </p>
                    {defindexEarnings !== null && defindexEarnings > 0 && (
                      <p className="text-xs text-yellow-400 font-medium">
                        + ${defindexEarnings.toFixed(4)} en rendimientos generados
                      </p>
                    )}
                  </div>
                )}
              </div>
              <PiggyBank className="h-10 w-10 text-blue-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-900/60 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-300 uppercase">Metas activas</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-300 uppercase">Completadas</p>
                <p className="text-2xl font-bold">{stats.achieved}</p>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-300 uppercase">Ahorrado</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalProgress)}</p>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-300 uppercase">Meta total</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalTarget)}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Info sobre ZK Proofs */}
        <ZKProofInfo />

        {/* Formulario */}
        <Card className="bg-gray-800/60 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5" />
              Crear nueva meta
            </CardTitle>
            <CardDescription className="text-gray-400">
              Establece objetivos claros y monitorea tu progreso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateGoal)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Monto objetivo (USDC)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          className="bg-gray-900/70 border-gray-700 text-white"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500">
                        Define cuánto deseas ahorrar para esta meta.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Fecha límite (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-gray-900/70 border-gray-700 text-white" {...field} />
                      </FormControl>
                      <FormDescription className="text-gray-500">
                        Añade una fecha para mantenerte motivado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear meta
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Lista de metas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Mis metas</h2>
            <ZKProofBadge variant="info" size="sm" />
          </div>

          {error && (
            <Card className="border-blue-500 bg-blue-500/10 text-white">
              <CardContent className="pt-6">
                <p>Error: {error.message}</p>
              </CardContent>
            </Card>
          )}

          {goals.length === 0 ? (
            <Card className="bg-gray-800/60 border-white/5">
              <CardContent className="pt-6 text-center text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tienes metas guardadas.</p>
                <p className="text-sm mt-2">
                  Crea tu primera meta usando el formulario superior.
                </p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
            const progress = getProgress(goal.id);
            if (!progress) return null;

            return (
                <Card
                  key={goal.id}
                  className={`bg-gray-800/60 border-white/10 text-white shadow-lg ${
                    goal.achieved ? 'ring-1 ring-yellow-400/40' : ''
                  }`}
                >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-white">
                          {goal.achieved ? (
                            <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <Target className="h-5 w-5" />
                          )}
                          Meta de ahorro
                          {goal.achieved && goal.proofId && (
                            <ZKProofBadge variant="success" size="sm" />
                          )}
                          {goal.achieved && (
                            <span className="text-sm font-normal text-yellow-400">
                              ✓ Alcanzada
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 text-gray-400">
                          Objetivo: {formatCurrency(goal.targetAmount)}
                          {goal.deadline && (
                            <span className="ml-4 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(new Date(goal.deadline))}
                            </span>
                          )}
                        </CardDescription>
                    </div>
                    {!goal.achieved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progreso */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-200">
                          Guardado: {formatCurrency(progress.currentBalance)} /{' '}
                          {formatCurrency(goal.targetAmount)}
                        </span>
                        <span className="text-sm font-bold">
                          {progress.progress.toFixed(1)}%
                        </span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    {progress.daysRemaining && (
                        <p className="text-xs text-gray-400 mt-1">
                          {progress.daysRemaining} días restantes
                        </p>
                    )}
                    {!goal.achieved && (
                      <div className="mt-3 space-y-2">
                        {showDepositModal === goal.id ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Monto a depositar"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="bg-gray-900/70 border-gray-700 text-white flex-1"
                              min="0.01"
                              step="0.01"
                            />
                            <Button
                              onClick={() => handleDeposit(goal.id)}
                              disabled={depositingGoalId === goal.id}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              {depositingGoalId === goal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Depositar'
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowDepositModal(null);
                                setDepositAmount('');
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-gray-400"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setShowDepositModal(goal.id)}
                            size="sm"
                            variant="outline"
                            className="w-full border-blue-400/30 text-blue-200 hover:bg-blue-500/10"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Depositar en esta cajita
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Estado y acciones */}
                  {goal.achieved ? (
                      <div className="flex items-center gap-2 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-100">
                            ¡Meta alcanzada!
                          </p>
                          {goal.proofId && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-yellow-400" />
                                <p className="text-xs text-yellow-200">
                                  Verificado con ZK Proof
                                </p>
                              </div>
                              <p className="text-xs text-yellow-300/70 font-mono">
                                Proof ID: {goal.proofId.substring(0, 16)}...
                              </p>
                              <p className="text-xs text-yellow-300/60 italic">
                                Tu balance real permanece privado
                              </p>
                            </div>
                          )}
                        </div>
                        {!goal.proofId && (
                          <Button
                            onClick={() => handleGenerateProof(goal.id)}
                            disabled={generatingProofId === goal.id}
                            size="sm"
                          >
                            {generatingProofId === goal.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generar Proof
                              </>
                            )}
                          </Button>
                        )}
                        {goal.proofId && (
                          <Button
                            onClick={() => handleClaimReward(goal.id)}
                            disabled={claimingRewardId === goal.id}
                            size="sm"
                            variant="outline"
                            className="border-yellow-400 text-yellow-200"
                          >
                            {claimingRewardId === goal.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Reclamando...
                              </>
                            ) : (
                              <>
                                <Award className="h-4 w-4 mr-2" />
                                Reclamar recompensa
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                  ) : progress.canGenerateProof ? (
                      <div className="flex items-center gap-2 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Shield className="h-5 w-5 text-blue-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-blue-100">
                              ¡Puedes generar un proof ZK!
                            </p>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-200 text-xs rounded-full border border-blue-400/30">
                              🔒 Privado
                            </span>
                          </div>
                          <p className="text-sm text-blue-200 mb-2">
                            Tu balance es suficiente para alcanzar la meta.
                          </p>
                          <div className="flex items-start gap-2 text-xs text-blue-300/80">
                            <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <p>
                              El proof ZK demuestra que alcanzaste tu meta <strong>sin revelar tu balance real</strong>
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleGenerateProof(goal.id)}
                          disabled={generatingProofId === goal.id}
                          size="sm"
                        >
                          {generatingProofId === goal.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generar proof
                            </>
                          )}
                        </Button>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 p-4 bg-white/5 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-300" />
                        <div className="flex-1">
                          <p className="font-medium">
                            Continúa ahorrando
                          </p>
                          <p className="text-sm text-gray-400">
                            Te faltan{' '}
                            {formatCurrency(goal.targetAmount - progress.currentBalance)}{' '}
                            para alcanzar tu meta.
                          </p>
                        </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            );
            })
          )}
        </div>
      </div>

      {/* Dialog de confirmación de transacción */}
      {txHash && (
        <Dialog open={!!txHash} onOpenChange={() => setTxHash(null)}>
          <DialogContent className="bg-gradient-to-br from-blue-600 to-cyan-600 border-none text-white max-w-md">
            <div className="text-center py-4">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-blue-500 rounded-full p-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              <DialogTitle className="text-2xl font-bold mb-2">
                {txType === 'create' && '¡Meta Creada!'}
                {txType === 'deposit' && '¡Depósito Exitoso!'}
                {txType === 'proof' && '¡Proof Verificado!'}
                {!txType && '¡Transacción Exitosa!'}
              </DialogTitle>
              
              <DialogDescription className="text-blue-100 mb-4">
                {txType === 'create' && (
                  <>Tu meta de ahorro ha sido creada correctamente en <strong>Stellar</strong>.</>
                )}
                {txType === 'deposit' && (
                  <>El depósito ha sido procesado correctamente en <strong>Stellar</strong>.</>
                )}
                {txType === 'proof' && (
                  <>Tu proof ZK ha sido verificado on-chain en <strong>Stellar</strong>.</>
                )}
                {!txType && (
                  <>La transacción ha sido procesada correctamente en <strong>Stellar</strong>.</>
                )}
              </DialogDescription>

              <div className="bg-white/20 rounded-lg p-3 mb-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blue-200">Hash de transacción:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(txHash);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-white" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="font-mono text-xs break-all text-left">{txHash}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`${STELLAR_EXPLORER_BASE}${txHash}`, '_blank')}
                  className="mt-2 text-xs text-blue-100 hover:text-white w-full justify-start"
                >
                  Ver en Stellar Expert <ExternalLink className="h-3 w-3 ml-1 inline" />
                </Button>
              </div>

              <Button
                onClick={() => {
                  setTxHash(null);
                  setTxType(null);
                }}
                className="bg-white text-black hover:bg-gray-100 font-bold w-full"
              >
                Continuar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <BottomNav />
    </div>
  );
};

