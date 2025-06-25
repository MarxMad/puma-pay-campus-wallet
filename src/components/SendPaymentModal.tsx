
import { useState } from 'react';
import { X, User, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, amount: string, concept: string) => void;
  isLoading: boolean;
}

const SendPaymentModal = ({ isOpen, onClose, onSend, isLoading }: SendPaymentModalProps) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (to && amount && concept) {
      onSend(to, amount, concept);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Enviar Pago</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="to" className="text-sm font-medium text-gray-700">
              Destinatario
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="to"
                type="text"
                placeholder="ID de estudiante o dirección wallet"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-10 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Cantidad (MXNB)
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
                className="pl-10 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="concept" className="text-sm font-medium text-gray-700">
              Concepto
            </Label>
            <Input
              id="concept"
              type="text"
              placeholder="Ej: Cafetería, Transporte, etc."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="rounded-xl"
              required
            />
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Pago'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendPaymentModal;
