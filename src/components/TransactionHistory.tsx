
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatMXNB } from '@/lib/arbitrum';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'payment':
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case 'deposit':
      case 'received':
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'payment':
        return transaction.merchant || 'Pago enviado';
      case 'deposit':
        return 'Depósito de fondos';
      case 'received':
        return 'Pago recibido';
      case 'withdrawal':
        return 'Retiro a cuenta bancaria';
      default:
        return 'Transacción';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Transacciones Recientes</h3>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-50 p-2 rounded-full">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {getTransactionTitle(transaction)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(transaction.timestamp)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'payment' || transaction.type === 'withdrawal' 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {transaction.type === 'payment' || transaction.type === 'withdrawal' ? '-' : '+'}
                  {formatMXNB(transaction.amount)}
                </p>
                <div className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-400' :
                    transaction.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-xs text-gray-500 capitalize">
                    {transaction.status === 'completed' ? 'Completada' :
                     transaction.status === 'pending' ? 'Pendiente' : 'Fallida'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
