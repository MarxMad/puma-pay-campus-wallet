import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Laptop, Monitor, TabletSmartphone, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { useBalance } from '@/hooks/useBalance';
import { getItemById } from '@/data/marketplace';
import { SkeletonBalance } from '@/components/SkeletonLoader';

const PremioIcon = ({ id }: { id: string }) => {
  if (id.includes('mac')) return <Laptop className="h-20 w-20 text-zinc-400" />;
  if (id.includes('pantalla') || id.includes('monitor')) return <Monitor className="h-20 w-20 text-zinc-400" />;
  return <TabletSmartphone className="h-20 w-20 text-zinc-400" />;
};

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { available, assetSymbol, isLoading: balanceLoading } = useBalance();
  const item = productId ? getItemById(productId) : null;
  const isDonation = item?.category === 'donaciones';
  const canAfford = item ? available >= item.priceXLM : false;

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Producto no encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/marketplace')}>
            Volver al Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate('/marketplace')}
        subtitle={isDonation ? 'Donación' : 'Premio'}
      />

      <div className="px-4 py-4">
        <Card className="bg-zinc-900/80 border-zinc-700 overflow-hidden mb-4">
          <div className="aspect-[16/10] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : isDonation ? (
              <Heart className="h-20 w-20 text-rose-400/80" />
            ) : (
              <PremioIcon id={item.id} />
            )}
          </div>
          <div className="p-4">
            <h1 className="text-xl font-bold text-white">{item.name}</h1>
            {item.causeName && (
              <p className="text-sm text-rose-400/90 mt-1">{item.causeName}</p>
            )}
            <p className="text-zinc-400 text-sm mt-2">{item.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold text-gold-500">{item.priceXLM} XLM</span>
              {balanceLoading ? (
                <SkeletonBalance />
              ) : (
                <span className="text-sm text-zinc-500">
                  Tu balance: {available.toFixed(2)} {assetSymbol}
                </span>
              )}
            </div>
          </div>
        </Card>

        {!canAfford && !balanceLoading && (
          <p className="text-amber-500 text-sm mb-4">
            No tienes suficiente balance. Recibe o compra XLM para continuar.
          </p>
        )}

        <Button
          className="w-full bg-gold-600 hover:bg-gold-500 text-black font-semibold"
          size="lg"
          disabled={!canAfford || balanceLoading}
          onClick={() => navigate(`/marketplace/${item.id}/checkout`)}
        >
          {isDonation ? 'Donar con XLM' : 'Comprar con XLM'}
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
