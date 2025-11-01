import { useState } from 'react';
import { ArrowLeft, QrCode, Camera, Copy, CheckCircle, AlertCircle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useBalance } from '@/hooks/useBalance';
import { junoService } from '@/services/junoService';
import { portalService } from '@/services/portal';
import { useAuth } from '@/contexts/AuthContext';

const SendPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { available, hasInsufficientFunds, refreshBalance, recalculateBalance } = useBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [summaryError, setSummaryError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleQRScan = (data: string) => {
    console.log('📱 QR escaneado:', data);
    setScannedData(data);
    setShowScanner(false);
  };

  // Abrir modal de confirmación
  const handleConfirmClick = () => {
    if (!scannedData || !amount) {
      setSummaryError('Por favor completa todos los campos');
      return;
    }

    const amountNum = parseFloat(amount);
    
    // Validar saldo disponible
    if (hasInsufficientFunds(amountNum)) {
      setSummaryError('Fondos insuficientes. Verifica tu saldo disponible.');
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmDialog(true);
  };

  // Confirmar y enviar la transacción
  const handleConfirmSend = async () => {
    if (!scannedData || !amount) return;

    setIsLoading(true);
    setSummaryError('');
    setShowConfirmDialog(false);
    
    try {
      const amountNum = parseFloat(amount);
      
      console.log('🚀 Enviando MXNB a wallet:', { to: scannedData, amount: amountNum });
      
      // Enviar MXNB a wallet usando Portal SDK (TRANSACCIÓN REAL)
      const hash = await portalService.sendMXNB(scannedData, amountNum);
      
      console.log('✅ Transacción enviada:', hash);
      setTxHash(hash);
      
      // Actualizar balance
      if (typeof refreshBalance === 'function') {
        await refreshBalance();
      } else if (typeof recalculateBalance === 'function') {
        recalculateBalance();
      }
      
      // Disparar evento para actualizar transacciones
      window.dispatchEvent(new CustomEvent('transactionAdded', {
        detail: {
          id: hash,
          amount: amountNum,
          type: 'expense',
          description: `Transferencia a ${scannedData.substring(0, 6)}...${scannedData.slice(-4)}`,
          categoryId: '',
          date: new Date(),
          txHash: hash,
          recipient: scannedData,
          isMXNB: true,
          tokenSymbol: 'MXNB'
        }
      }));
      
      window.dispatchEvent(new CustomEvent('forceBalanceUpdate'));
      
      // Esperar un poco antes de navegar para que el usuario vea el éxito
      setTimeout(() => {
        navigate('/home');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error al enviar:', error);
      setSummaryError(error.message || 'Error al enviar. Intenta nuevamente.');
      setShowConfirmDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (scannedData) {
      navigator.clipboard.writeText(scannedData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.slice(-4)}`;
  };

  const amountNum = amount ? parseFloat(amount) : 0;
  const newBalance = available - amountNum;

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
                onClick={handleConfirmClick}
                disabled={isLoading || !amount || parseFloat(amount) <= 0 || hasInsufficientFunds(amountNum)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Continuar
              </Button>
            </div>
          </Card>
        )}

        {/* Modal de Confirmación de Transacción */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center space-x-2">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                <span>Confirmar Transacción</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 pt-2">
                Revisa los detalles antes de enviar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Destinatario */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Destinatario</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-6 px-2 text-xs"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm break-all">{scannedData}</p>
                  </div>
                </div>
              </div>

              {/* Cantidad */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <span className="text-sm text-gray-400 block mb-2">Cantidad</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">
                    {amountNum.toFixed(2)} <span className="text-lg text-gray-400">MXNB</span>
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">≈ ${(amountNum).toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>

              {/* Balance después */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <span className="text-sm text-gray-400 block mb-2">Balance después</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-green-400">
                    ${newBalance.toFixed(2)} <span className="text-sm text-gray-400">MXNB</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    Balance actual: ${available.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Network */}
              <div className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Red</span>
                </div>
                <span className="text-sm font-medium">Arbitrum Sepolia</span>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-200">
                  Esta transacción es <strong>irreversible</strong>. Asegúrate de que la dirección de destino sea correcta.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isLoading}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSend}
                disabled={isLoading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Enviando...
                  </span>
                ) : (
                  'Confirmar Envío'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Éxito */}
        {txHash && (
          <Dialog open={!!txHash} onOpenChange={() => setTxHash(null)}>
            <DialogContent className="bg-gradient-to-br from-green-600 to-emerald-600 border-none text-white max-w-md">
              <div className="text-center py-4">
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-green-500 rounded-full p-4">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                
                <DialogTitle className="text-2xl font-bold mb-2">¡Transacción Exitosa!</DialogTitle>
                <DialogDescription className="text-green-100 mb-4">
                  Tu transferencia de <strong>{amountNum.toFixed(2)} MXNB</strong> ha sido enviada correctamente.
                </DialogDescription>

                <div className="bg-white/20 rounded-lg p-3 mb-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-green-200">Hash de transacción:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(txHash);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      {copied ? (
                        <CheckCircle className="h-3 w-3 text-white" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="font-mono text-xs break-all text-left">{txHash}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://sepolia.arbiscan.io/tx/${txHash}`, '_blank')}
                    className="mt-2 text-xs text-green-100 hover:text-white"
                  >
                    Ver en Arbiscan <ExternalLink className="h-3 w-3 ml-1 inline" />
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setTxHash(null);
                    navigate('/home');
                  }}
                  className="bg-white text-green-600 hover:bg-gray-100 font-bold"
                >
                  Continuar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SendPage;