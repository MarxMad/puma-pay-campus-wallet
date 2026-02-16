import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { useBalance } from '@/hooks/useBalance';
import { useAuth } from '@/contexts/AuthContext';
import { getItemById } from '@/data/marketplace';
import { toast } from '@/hooks/use-toast';
import { stellarService, decryptSecretKey } from '@/services/stellarService';
import { recordDonation } from '@/services/donationService';
import { courseGamificationService } from '@/services/courseGamificationService';

/** Dirección de destino para pagos del marketplace (merchant/causa). En producción viene del backend. */
const MARKETPLACE_DESTINATION = import.meta.env.VITE_MARKETPLACE_WALLET || '';

export default function Checkout() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { available, refreshBalance } = useBalance();
  const item = productId ? getItemById(productId) : null;
  const [step, setStep] = useState<'confirm' | 'paying' | 'success'>('confirm');
  const [error, setError] = useState('');

  const isDonation = item?.category === 'donaciones';
  const canAfford = item ? available >= item.priceXLM : false;
  const userEmail = user?.email || user?.address || '';

  const handlePay = async () => {
    if (!item || !canAfford) return;
    setError('');
    setStep('paying');

    try {
      const destination = item.destinationAddress || MARKETPLACE_DESTINATION;

      if (destination && user?.clabe) {
        const secretKey = decryptSecretKey(user.clabe);
        await stellarService.sendXLM(destination, item.priceXLM, secretKey);
      }
      await new Promise((r) => setTimeout(r, 1200));

      if (isDonation && userEmail) {
        const result = await recordDonation(userEmail, item.id, item.priceXLM);
        if (result.bonusAwarded > 0) {
          courseGamificationService.addDonationBonusPoints(userEmail, result.bonusAwarded);
          queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
          toast({
            title: '¡Bonus por donaciones!',
            description: `+${result.bonusAwarded} puntos (${result.donationCount} donaciones). Sigue donando cada 5 para más puntos.`,
          });
        }
      }

      if (typeof refreshBalance === 'function') await refreshBalance();
      window.dispatchEvent(new CustomEvent('forceBalanceUpdate'));
      setStep('success');
      toast({
        title: isDonation ? 'Donación realizada' : 'Compra realizada',
        description: `${item.priceXLM} XLM ${isDonation ? 'donados' : 'pagados'} correctamente.`,
      });
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pago.');
      setStep('confirm');
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-zinc-400">Producto no encontrado.</p>
        <Button variant="outline" className="ml-4" onClick={() => navigate('/marketplace')}>
          Volver
        </Button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-24 flex flex-col">
        <AppHeader
          leftAction={<ArrowLeft className={headerIconClass} />}
          onLeftAction={() => navigate('/marketplace')}
          subtitle="Listo"
        />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="rounded-full bg-positive-500/20 p-4 mb-4">
            <CheckCircle className="h-16 w-16 text-positive-500" />
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            {isDonation ? '¡Gracias por tu donación!' : '¡Compra realizada!'}
          </h2>
          <p className="text-zinc-400 text-center mt-2">
            {item.priceXLM} XLM {isDonation ? 'donados a' : 'pagados por'} {item.name}.
          </p>
          <Button
            className="mt-8 bg-gold-600 hover:bg-gold-500 text-black"
            onClick={() => navigate('/marketplace')}
          >
            Volver al Marketplace
          </Button>
          <Button variant="ghost" className="mt-2 text-zinc-400" onClick={() => navigate('/home')}>
            Ir a Inicio
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate(-1)}
        subtitle="Confirmar pago"
      />

      <div className="px-4 py-4">
        <Card className="bg-zinc-900/80 border-zinc-700 p-4 mb-4">
          <h2 className="font-semibold text-white">{item.name}</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {isDonation ? 'Donación' : 'Premio'} • {item.priceXLM} XLM
          </p>
          <div className="mt-4 pt-4 border-t border-zinc-700 flex justify-between text-sm">
            <span className="text-zinc-400">Total a pagar</span>
            <span className="font-bold text-gold-500">{item.priceXLM} XLM</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-zinc-400">Tu balance</span>
            <span className={available >= item.priceXLM ? 'text-white' : 'text-amber-500'}>
              {available.toFixed(2)} XLM
            </span>
          </div>
        </Card>

        {error && (
          <p className="text-amber-500 text-sm mb-4">{error}</p>
        )}

        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>El pago se realiza en la red Stellar. Verifica el monto antes de confirmar.</span>
        </div>

        <Button
          className="w-full bg-gold-600 hover:bg-gold-500 text-black font-semibold"
          size="lg"
          disabled={step === 'paying' || !canAfford}
          onClick={handlePay}
        >
          {step === 'paying' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Procesando...
            </>
          ) : (
            <>Confirmar y pagar {item.priceXLM} XLM</>
          )}
        </Button>

        <Button variant="ghost" className="w-full mt-2 text-zinc-400" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
