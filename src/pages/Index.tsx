
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import WalletHeader from '@/components/WalletHeader';
import BalanceCard from '@/components/BalanceCard';
import QuickActions from '@/components/QuickActions';
import TransactionHistory from '@/components/TransactionHistory';
import SendPaymentModal from '@/components/SendPaymentModal';
import DepositModal from '@/components/DepositModal';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { 
    balance, 
    transactions, 
    user, 
    isConnected, 
    isLoading, 
    connectWallet, 
    sendPayment, 
    depositFiat 
  } = useWallet();

  const [showSendModal, setShowSendModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { toast } = useToast();

  const handleSend = () => setShowSendModal(true);
  const handleDeposit = () => setShowDepositModal(true);
  const handleScan = () => {
    toast({
      title: "Escáner QR",
      description: "Funcionalidad disponible próximamente",
    });
  };
  const handleWithdraw = () => {
    toast({
      title: "Retiro a banco",
      description: "Funcionalidad disponible próximamente",
    });
  };

  const handleSendPayment = async (to: string, amount: string, concept: string) => {
    await sendPayment(to, amount, concept);
    setShowSendModal(false);
    toast({
      title: "Pago enviado",
      description: `Se enviaron $${amount} MXNB exitosamente`,
    });
  };

  const handleDepositFiat = async (amount: string) => {
    await depositFiat(amount);
    setShowDepositModal(false);
    toast({
      title: "Depósito exitoso",
      description: `Se convirtieron $${amount} MXN a MXNB`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WalletHeader 
        user={user} 
        isConnected={isConnected} 
        onConnect={connectWallet} 
      />

      {/* Balance Card */}
      <BalanceCard balance={balance} />

      {/* Quick Actions */}
      <QuickActions 
        onSend={handleSend}
        onDeposit={handleDeposit}
        onScan={handleScan}
        onWithdraw={handleWithdraw}
      />

      {/* Transaction History */}
      <TransactionHistory transactions={transactions} />

      {/* Modals */}
      <SendPaymentModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={handleSendPayment}
        isLoading={isLoading}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDepositFiat}
        isLoading={isLoading}
      />

      {/* Floating Logo */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg">
          <span className="text-lg font-bold">₱</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
