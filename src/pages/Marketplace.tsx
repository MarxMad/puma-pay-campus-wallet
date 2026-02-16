import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Heart, Sparkles, Laptop, Monitor, TabletSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { PREMIOS, DONACIONES, type MarketplaceItem, type MarketplaceCategory } from '@/data/marketplace';

const PremioIcon = ({ id }: { id: string }) => {
  if (id.includes('mac')) return <Laptop className="h-12 w-12 text-zinc-400" />;
  if (id.includes('pantalla') || id.includes('monitor')) return <Monitor className="h-12 w-12 text-zinc-400" />;
  return <TabletSmartphone className="h-12 w-12 text-zinc-400" />;
};

const DonacionIcon = () => <Heart className="h-12 w-12 text-rose-400/80" />;

const ItemCard = ({ item, isDonation }: { item: MarketplaceItem; isDonation: boolean }) => {
  const navigate = useNavigate();
  return (
    <Card
      className="bg-zinc-900/80 border-zinc-700 overflow-hidden cursor-pointer hover:border-gold-500/50 transition-colors"
      onClick={() => navigate(`/marketplace/${item.id}`)}
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : isDonation ? (
          <DonacionIcon />
        ) : (
          <PremioIcon id={item.id} />
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-white truncate">{item.name}</p>
        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-gold-500 font-bold">{item.priceXLM} XLM</span>
          <span className="text-xs text-zinc-500">{isDonation ? 'Donar' : 'Canjear'}</span>
        </div>
      </div>
    </Card>
  );
};

export default function Marketplace() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MarketplaceCategory>('premios');

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate('/home')}
        subtitle="Marketplace"
      />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 text-zinc-400 mb-4">
          <Sparkles className="h-5 w-5 text-gold-500" />
          <p className="text-sm">Canjea XLM por premios o apoya causas del campus.</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as MarketplaceCategory)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-700">
            <TabsTrigger value="premios" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-500">
              <Gift className="h-4 w-4 mr-2" />
              Premios
            </TabsTrigger>
            <TabsTrigger value="donaciones" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <Heart className="h-4 w-4 mr-2" />
              Donaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="premios" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PREMIOS.map((item) => (
                <ItemCard key={item.id} item={item} isDonation={false} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="donaciones" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DONACIONES.map((item) => (
                <ItemCard key={item.id} item={item} isDonation /> 
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}
