import { useState } from 'react';
import { ArrowLeft, QrCode, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ReceivePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');

  const walletAddress = user?.address || '';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    alert('¡Dirección copiada al portapapeles!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi dirección PumaPay',
          text: `Envía MXNB a mi wallet PumaPay: ${walletAddress}`,
          url: walletAddress
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(walletAddress);
      alert('¡Dirección copiada al portapapeles!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Recibir MXNB</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6">
        {/* QR Code */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center">
              <div className="w-28 h-28 bg-gray-900 rounded flex items-center justify-center">
                <QrCode className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Código QR</h3>
              <p className="text-gray-300 text-sm">
                Comparte este código para recibir MXNB
              </p>
            </div>
          </div>
        </Card>

        {/* Wallet Address */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Tu dirección de wallet</label>
              <div className="bg-gray-700 rounded-lg p-4 font-mono text-sm break-all">
                {walletAddress || 'Cargando...'}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleCopyAddress}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button 
                onClick={handleShare}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </div>
          </div>
        </Card>

        {/* Amount Request (Optional) */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Monto solicitado (opcional)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">MXNB</p>
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2">
              {['10', '25', '50', '100'].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount)}
                  variant="outline"
                  className="text-sm hover:bg-gray-600"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>

            {amount && (
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
                <p className="text-blue-400 text-sm font-medium">💡 Información</p>
                <p className="text-blue-300 text-xs mt-1">
                  El monto solicitado aparecerá en el QR para facilitar el envío
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">¿Cómo recibir MXNB?</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Comparte tu código QR o dirección de wallet</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>El remitente escanea el QR o copia la dirección</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Recibe el MXNB directamente en tu wallet</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReceivePage;