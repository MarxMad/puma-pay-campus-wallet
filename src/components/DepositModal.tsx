
import { useState } from 'react';
import { X, Banknote, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: string) => void;
  isLoading: boolean;
}

const DepositModal = ({ isOpen, onClose, onDeposit, isLoading }: DepositModalProps) => {
  const [amount, setAmount] = useState('');

  const quickAmounts = ['100', '250', '500', '1000'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount) {
      onDeposit(amount);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Depositar Fondos</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Conexión Bitso</span>
          </div>
          <p className="text-sm text-blue-700">
            Convierte MXN fiat a MXNB automáticamente. Disponible en tu wallet al instante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Cantidad (MXN)
            </Label>
            <div className="relative mt-1">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 rounded-xl text-lg"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Cantidades Rápidas
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(quickAmount)}
                  className="rounded-xl py-3 text-sm"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Recibirás:</span>
              <span className="font-semibold text-gray-900">
                {amount ? `${amount} MXNB` : '0.00 MXNB'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600">Comisión:</span>
              <span className="text-gray-900">$0.00 MXN</span>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : 'Depositar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
