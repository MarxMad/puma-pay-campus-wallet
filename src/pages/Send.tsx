import { useState } from 'react';
import { ArrowLeft, QrCode, Camera, Copy, CheckCircle, AlertCircle, ExternalLink, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useBalance } from '@/hooks/useBalance';
import { portalService } from '@/services/portal';
import { useAuth } from '@/contexts/AuthContext';

const SendPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { available, hasInsufficientFunds, refreshBalance, recalculateBalance } = useBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [summaryError, setSummaryError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputMethod, setInputMethod] = useState<'manual' | 'qr'>('manual');

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleQRScan = (data: string) => {
    console.log('📱 QR escaneado:', data);
    // Extraer dirección si el QR contiene más información
    const addressMatch = data.match(/0x[a-fA-F0-9]{40}/);
    const address = addressMatch ? addressMatch[0] : data;
    
    if (isValidAddress(address)) {
      setWalletAddress(address);
      setShowScanner(false);
      setInputMethod('qr');
    } else {
      setSummaryError('El código QR no contiene una dirección de wallet válida');
    }
  };

  // Abrir modal de confirmación
  const handleConfirmClick = () => {
    if (!walletAddress || !amount) {
      setSummaryError('Por favor completa todos los campos');
      return;
    }

    // Validar dirección de wallet
    if (!isValidAddress(walletAddress)) {
      setSummaryError('Dirección de wallet inválida. Debe ser una dirección Ethereum válida (0x...)');
      return;
    }

    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setSummaryError('Por favor ingresa un monto válido');
      return;
    }
    
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
    if (!walletAddress || !amount) return;

    setIsLoading(true);
    setSummaryError('');
    setShowConfirmDialog(false);
    
    try {
      const amountNum = parseFloat(amount);
      
      if (!isValidAddress(walletAddress)) {
        throw new Error('Dirección de wallet inválida');
      }
      
      console.log('🚀 Enviando MXNB a wallet en Arbitrum:', { 
        to: walletAddress, 
        amount: amountNum,
        network: 'Arbitrum Sepolia',
        token: 'MXNB'
      });
      
      // Enviar MXNB a wallet usando Portal SDK (TRANSACCIÓN REAL EN ARBITRUM)
      const hash = await portalService.sendMXNB(walletAddress, amountNum);
      
      console.log('✅ Transacción enviada en Arbitrum:', hash);
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
          description: `Transferencia MXNB a ${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`,
          categoryId: '',
          date: new Date(),
          txHash: hash,
          recipient: walletAddress,
          isMXNB: true,
          tokenSymbol: 'MXNB',
          network: 'Arbitrum Sepolia'
        }
      }));
      
      window.dispatchEvent(new CustomEvent('forceBalanceUpdate'));
      
      // Esperar un poco antes de navegar para que el usuario vea el éxito
      setTimeout(() => {
        navigate('/home');
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Error al enviar:', error);
      setSummaryError(error.message || 'Error al enviar. Intenta nuevamente.');
      setShowConfirmDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
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
        <div className="text-center">
          <h1 className="text-lg font-semibold">Enviar MXNB</h1>
          <p className="text-xs text-gray-400">Red: Arbitrum Sepolia</p>
        </div>
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

        {/* Wallet Address Input */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dirección de destino</h3>
              <p className="text-gray-300 text-sm mb-4">
                Ingresa la dirección de la wallet del destinatario en Arbitrum
              </p>
            </div>

            {/* Método de entrada */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => {
                  setInputMethod('manual');
                  setShowScanner(false);
                }}
                variant={inputMethod === 'manual' ? 'default' : 'outline'}
                className={`flex-1 ${inputMethod === 'manual' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Manual
              </Button>
              <Button
                onClick={() => {
                  setInputMethod('qr');
                  setShowScanner(true);
                }}
                variant={inputMethod === 'qr' ? 'default' : 'outline'}
                className={`flex-1 ${inputMethod === 'qr' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Escanear QR
              </Button>
            </div>

            {/* Input Manual */}
            {inputMethod === 'manual' && (
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Dirección de wallet (0x...)</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => {
                    setWalletAddress(e.target.value.trim());
                    setSummaryError('');
                  }}
                  placeholder="0x..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                {walletAddress && !isValidAddress(walletAddress) && (
                  <p className="text-xs text-red-400">
                    Dirección inválida. Debe comenzar con 0x y tener 42 caracteres.
                  </p>
                )}
                {walletAddress && isValidAddress(walletAddress) && (
                  <p className="text-xs text-green-400 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Dirección válida
                  </p>
                )}
              </div>
            )}

            {/* QR Scanner */}
            {inputMethod === 'qr' && (
              <div className="space-y-4">
                {!showScanner ? (
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-300 mb-2">
                      Presiona el botón para escanear el código QR
                    </p>
                    <Button 
                      onClick={() => setShowScanner(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Abrir cámara QR
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-300">Cámara activa</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Escanea el código QR con la dirección de wallet
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowScanner(false)}
                      variant="ghost"
                      className="w-full"
                    >
                      Cancelar escaneo
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      Nota: El escáner QR se integrará con la API de cámara del navegador.
                      Por ahora, puedes ingresar la dirección manualmente.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Wallet Address Display */}
            {walletAddress && isValidAddress(walletAddress) && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-green-400 text-sm font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Dirección válida
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-6 px-2 text-xs"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-green-400" />
                    )}
                  </Button>
                </div>
                <p className="text-green-300 text-xs mt-2 font-mono break-all">
                  {walletAddress}
                </p>
                <p className="text-green-400 text-xs mt-2">
                  Red: <span className="font-semibold">Arbitrum Sepolia</span> | Token: <span className="font-semibold">MXNB</span>
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Amount Input */}
        {walletAddress && isValidAddress(walletAddress) && (
          <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Monto a enviar</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">MXNB (Arbitrum Sepolia)</p>
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
                <span>Confirmar Transacción MXNB</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 pt-2">
                Revisa los detalles antes de enviar. Esta transacción se realizará en <strong>Arbitrum Sepolia</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Token y Red */}
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">M</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">MXNB</span>
                    <p className="text-xs text-gray-300">Arbitrum Sepolia Network</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-gray-300 mt-1">Red Activa</p>
                </div>
              </div>

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
                    <Wallet className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm break-all">{walletAddress}</p>
                  </div>
                </div>
              </div>

              {/* Cantidad */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <span className="text-sm text-gray-400 block mb-2">Cantidad a enviar</span>
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

              {/* Advertencia */}
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-yellow-200 font-semibold mb-1">
                    Esta transacción es <strong>irreversible</strong> e <strong>inmediata</strong>.
                  </p>
                  <p className="text-xs text-yellow-200">
                    Asegúrate de que la dirección de destino sea correcta y esté en la red <strong>Arbitrum Sepolia</strong>.
                  </p>
                </div>
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
                  Tu transferencia de <strong>{amountNum.toFixed(2)} MXNB</strong> ha sido enviada correctamente en <strong>Arbitrum Sepolia</strong>.
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