
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { WalletBalance } from '@/types/wallet';
import { formatMXNB } from '@/lib/arbitrum';

interface BalanceCardProps {
  balance: WalletBalance;
}

const BalanceCard = ({ balance }: BalanceCardProps) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-6 rounded-3xl shadow-xl mx-4 -mt-8 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Saldo Total</h2>
        <button 
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-white/80 text-sm">MXNB (Arbitrum)</p>
          <p className="text-3xl font-bold">
            {showBalance ? formatMXNB(balance.mxnb) : '••••••'}
          </p>
        </div>
        
        <div className="pt-2 border-t border-white/20">
          <p className="text-white/80 text-sm">Fiat Disponible</p>
          <p className="text-lg font-semibold">
            {showBalance ? formatMXNB(balance.fiat) : '••••••'}
          </p>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 opacity-20">
        <div className="w-12 h-12 border-4 border-white rounded-full flex items-center justify-center">
          <span className="text-xs font-bold">₱</span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
