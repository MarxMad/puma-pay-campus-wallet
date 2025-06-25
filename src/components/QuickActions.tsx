
import { ArrowUp, ArrowDown, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onSend: () => void;
  onDeposit: () => void;
  onScan: () => void;
  onWithdraw: () => void;
}

const QuickActions = ({ onSend, onDeposit, onScan, onWithdraw }: QuickActionsProps) => {
  const actions = [
    {
      icon: ArrowUp,
      label: 'Enviar',
      action: onSend,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: ArrowDown,
      label: 'Depositar',
      action: onDeposit,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Search,
      label: 'Escanear',
      action: onScan,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: Wallet,
      label: 'Retirar',
      action: onWithdraw,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            className={`${action.color} text-white h-16 flex flex-col items-center justify-center space-y-1 rounded-2xl shadow-lg transition-transform hover:scale-105`}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
