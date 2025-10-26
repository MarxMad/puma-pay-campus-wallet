import { useState } from 'react';
import { ArrowLeft, QrCode, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useBalance } from '@/hooks/useBalance';
import { junoService } from '@/services/junoService';
import { portalService } from '@/services/portal';

const SendPage = () => {
  const navigate = useNavigate();
  const { available, hasInsufficientFunds, refreshBalance, recalculateBalance } = useBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [summaryError, setSummaryError] = useState('');

  const handleQRScan = (data: string) => {
    console.log('📱 QR escaneado:', data);
    setScannedData(data);
    setShowScanner(false);
  };

  const handleSend = async () => {
    if (!scannedData || !amount) {
      setSummaryError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setSummaryError('');
    
    try {
      const amountNum = parseFloat(amount);
      
      // Validar saldo disponible
      if (hasInsufficientFunds(amountNum)) {
        setSummaryError('Fondos insuficientes. Verifica tu saldo disponible.');
        setIsLoading(false);
        return;
      }

      console.log('🚀 Enviando MXNB a wallet:', { to: scannedData, amount: amountNum });
      
      // Enviar MXNB a wallet usando Portal SDK (TRANSACCIÓN REAL)
      const txHash = await portalService.sendMXNB(scannedData, amountNum);
      
      console.log('✅ Transacción enviada:', txHash);
      
      // Actualizar balance
      if (typeof refreshBalance === 'function') {
        await refreshBalance();
      } else if (typeof recalculateBalance === 'function') {
        recalculateBalance();
      }
      
      alert(`¡Transferencia enviada exitosamente!\nHash: ${txHash}`);
      navigate('/home');
      
    } catch (error) {
      console.error('❌ Error al enviar:', error);
      setSummaryError(error.message || 'Error al enviar. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Enviar MXNB</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6">
        {/* Balance */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
          <div className="text-center">
            <span className="text-gray-300 text-sm">Saldo disponible</span>
            <div className="text-3xl font-bold mt-2">
              ${available.toFixed(2)} <span className="text-lg text-gray-400">MXNB</span>
            </div>
          </div>
        </Card>

        {/* QR Scanner */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Escanear código QR</h3>
              <p className="text-gray-300 text-sm">
                Escanea el código QR de la wallet del destinatario
              </p>
            </div>

            {!showScanner ? (
              <Button 
                onClick={() => setShowScanner(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="h-5 w-5 mr-2" />
                Abrir cámara
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-300">Cámara activa - Escanea el QR</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Simulación: Presiona "Simular escaneo" para continuar
                  </p>
                </div>
                <Button 
                  onClick={() => handleQRScan('0x1234567890abcdef1234567890abcdef12345678')}
                  variant="outline"
                  className="w-full"
                >
                  Simular escaneo QR
                </Button>
                <Button 
                  onClick={() => setShowScanner(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            )}

            {scannedData && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
                <p className="text-green-400 text-sm font-medium">✅ QR escaneado exitosamente</p>
                <p className="text-green-300 text-xs mt-1 font-mono break-all">
                  {scannedData}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Amount Input */}
        {scannedData && (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Monto a enviar</label>
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
                    disabled={hasInsufficientFunds(parseFloat(quickAmount))}
                    variant="outline"
                    className={`text-sm ${
                      hasInsufficientFunds(parseFloat(quickAmount)) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-600'
                    }`}
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>

              {summaryError && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{summaryError}</p>
                </div>
              )}

              <Button 
                onClick={handleSend}
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Enviando...
                  </span>
                ) : (
                  'Enviar MXNB'
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SendPage;