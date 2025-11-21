import React, { useState } from 'react';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useBalance } from '@/hooks/useBalance';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Metas de Ahorro
          </h1>
          <p className="text-muted-foreground mt-2">
            Establece metas de ahorro y demuestra tu progreso con ZK proofs
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Balance actual</p>
          <p className="text-2xl font-bold">
            {formatCurrency(balance.balance || 0)}
          </p>
        </div>
      </div>

      {/* Formulario para crear meta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Nueva Meta
          </CardTitle>
          <CardDescription>
            Establece una meta de ahorro y trabaja para alcanzarla
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateGoal)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Objetivo (MXN)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      El monto que deseas ahorrar
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
                    <FormLabel>Fecha Límite (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Fecha límite para alcanzar la meta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Meta
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Lista de metas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Mis Metas</h2>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                Error: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {goals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes metas de ahorro aún.</p>
              <p className="text-sm mt-2">
                Crea tu primera meta usando el formulario de arriba.
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
                className={
                  goal.achieved
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : ''
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {goal.achieved ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Target className="h-5 w-5" />
                        )}
                        Meta de Ahorro
                        {goal.achieved && (
                          <span className="text-sm font-normal text-green-600">
                            ✓ Alcanzada
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
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
                      <span className="text-sm font-medium">
                        Progreso: {formatCurrency(progress.currentBalance)} /{' '}
                        {formatCurrency(goal.targetAmount)}
                      </span>
                      <span className="text-sm font-bold">
                        {progress.progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    {progress.daysRemaining && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {progress.daysRemaining} días restantes
                      </p>
                    )}
                  </div>

                  {/* Estado y acciones */}
                  {goal.achieved ? (
                    <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          ¡Meta alcanzada!
                        </p>
                        {goal.proofId && (
                          <p className="text-sm text-green-700 dark:text-green-200">
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
                        >
                          {claimingRewardId === goal.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Reclamando...
                            </>
                          ) : (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              Reclamar Recompensa
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : progress.canGenerateProof ? (
                    <div className="flex items-center gap-2 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          ¡Puedes generar un proof ZK!
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                          Tu balance es suficiente para alcanzar la meta
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
                            Generar Proof
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium">
                          Continúa ahorrando
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Te faltan{' '}
                          {formatCurrency(
                            goal.targetAmount - progress.currentBalance
                          )}{' '}
                          para alcanzar tu meta
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
    </div>
  );
};

