
import { User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User as UserType } from '@/types/wallet';

interface WalletHeaderProps {
  user: UserType;
  isConnected: boolean;
  onConnect: () => void;
}

const WalletHeader = ({ user, isConnected, onConnect }: WalletHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-6 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">¡Hola, {user.name.split(' ')[0]}!</h1>
            <p className="text-blue-200 text-sm">{user.university} • {user.student_id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          {!isConnected && (
            <Button 
              onClick={onConnect}
              variant="outline" 
              size="sm"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Conectar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletHeader;
