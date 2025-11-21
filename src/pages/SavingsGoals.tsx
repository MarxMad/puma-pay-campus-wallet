import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const {
    goals,
    isLoading,
    error,
    createGoal,
    deleteGoal,
    updateGoal,
    getProgress,
    generateProof,
    claimReward,
  } = useSavingsGoals();
  const { balance } = useBalance();
  const [isCreating, setIsCreating] = useState(false);
  const [generatingProofId, setGeneratingProofId] = useState<string | null>(null);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);

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

      await createGoal(values.targetAmount, deadline);
      toast({
        title: 'Meta creada',
        description: 'Tu meta de ahorro ha sido creada exitosamente.',
      });
      form.reset();
    } catch (err: any) {
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
      await generateProof(goalId);
      toast({
        title: 'Proof generado',
        description: 'El proof ZK ha sido generado exitosamente.',
      });
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
          <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 border border-orange-500/30 rounded-full flex items-center justify-center shadow-inner">
            <img src="/PumaPay.png" alt="PumaPay" className="h-6 w-6 object-contain" />
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
                <p className="text-sm text-orange-100">Balance disponible</p>
                <h2 className="text-3xl font-bold mt-1">
                  ${(balance.available || 0).toFixed(2)}
                  <span className="text-base text-orange-100 ml-2">USDC</span>
                </h2>
              </div>
              <PiggyBank className="h-10 w-10 text-orange-100" />
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
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
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
          <h2 className="text-2xl font-semibold">Mis metas</h2>

          {error && (
            <Card className="border-red-500 bg-red-500/10 text-white">
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
                    goal.achieved ? 'ring-1 ring-green-400/40' : ''
                  }`}
                >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-white">
                          {goal.achieved ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Target className="h-5 w-5" />
                          )}
                          Meta de ahorro
                          {goal.achieved && (
                            <span className="text-sm font-normal text-green-400">
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
                          Progreso: {formatCurrency(progress.currentBalance)} /{' '}
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
                  </div>

                  {/* Estado y acciones */}
                  {goal.achieved ? (
                      <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                        <Award className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium text-green-100">
                            ¡Meta alcanzada!
                          </p>
                          {goal.proofId && (
                            <p className="text-sm text-green-200">
                              Proof ID: {goal.proofId.substring(0, 16)}...
                            </p>
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
                            className="border-green-400 text-green-200"
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
                      <div className="flex items-center gap-2 p-4 bg-blue-500/10 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-100">
                            ¡Puedes generar un proof ZK!
                          </p>
                          <p className="text-sm text-blue-200">
                            Tu balance es suficiente para alcanzar la meta.
                          </p>
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
                        <TrendingUp className="h-5 w-5 text-orange-300" />
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
      <BottomNav />
    </div>
  );
};

