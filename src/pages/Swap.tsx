import { useState } from 'react';
import { ArrowLeft, ArrowUpDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

type Currency = 'ARBITRUM' | 'MXNB' | 'MXN';

const SwapPage = () => {
  const navigate = useNavigate();
  const [fromCurrency, setFromCurrency] = useState<Currency>('ARBITRUM');
  const [toCurrency, setToCurrency] = useState<Currency>('MXNB');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Tipos de cambio simulados
  const exchangeRates = {
    'ARBITRUM-MXNB': 35420.50,
    'ARBITRUM-MXN': 35420.50,
    'MXNB-ARBITRUM': 0.0000282,
    'MXNB-MXN': 1.0,
    'MXN-ARBITRUM': 0.0000282,
    'MXN-MXNB': 1.0
  };

  // Balances simulados
  const balances = {
    ARBITRUM: 0.0425,
    MXNB: 1247.50,
    MXN: 2450.00
  };

  const getExchangeRate = () => {
    const key = `${fromCurrency}-${toCurrency}` as keyof typeof exchangeRates;
    return exchangeRates[key] || 1;
  };

  const calculateToAmount = (amount: string) => {
    if (!amount) return '';
    const rate = getExchangeRate();
    const result = parseFloat(amount) * rate;
    return result.toFixed(fromCurrency === 'ARBITRUM' ? 2 : 6);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(calculateToAmount(value));
  };

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    
    // Recalcular los montos
    if (fromAmount) {
      const newToAmount = calculateToAmount(fromAmount);
      setToAmount(newToAmount);
    }
  };

  const handleMaxAmount = () => {
    const maxBalance = balances[fromCurrency].toString();
    setFromAmount(maxBalance);
    setToAmount(calculateToAmount(maxBalance));
  };

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) return;
    
    setIsLoading(true);
    try {
      // Simular intercambio
      console.log(`Intercambiando ${fromAmount} ${fromCurrency} por ${toAmount} ${toCurrency}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      alert(`¡Intercambio exitoso! Has recibido ${toAmount} ${toCurrency}`);
      navigate('/home');
    } catch (error) {
      console.error('Error en el intercambio:', error);
      alert('Error al realizar el intercambio. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrencyIcon = (currency: Currency) => {
    switch (currency) {
      case 'ARBITRUM':
        return '🔵';
      case 'MXNB':
        return '💰';
      case 'MXN':
        return '🏦';
      default:
        return '💱';
    }
  };

  const isSwapValid = fromAmount && toAmount && parseFloat(fromAmount) <= balances[fromCurrency] && parseFloat(fromAmount) > 0;

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Intercambiar</h1>
        <div></div>
      </div>

      <div className="p-4 space-y-6">
        {/* From Currency */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 text-sm">Desde</span>
            <span className="text-gray-300 text-sm">
              Balance: {balances[fromCurrency]} {fromCurrency}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-xl">
              <span className="text-xl">{getCurrencyIcon(fromCurrency)}</span>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="ARBITRUM">ARBITRUM</option>
                <option value="MXNB">MXNB</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
            
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="flex-1 text-right text-xl font-semibold bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <Button
            onClick={handleMaxAmount}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 mt-2"
          >
            Usar máximo
          </Button>
        </Card>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSwapCurrencies}
            className="bg-purple-600 hover:bg-purple-700 rounded-full p-3"
          >
            <ArrowUpDown className="h-6 w-6" />
          </Button>
        </div>

        {/* To Currency */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 text-sm">Hacia</span>
            <span className="text-gray-300 text-sm">
              Balance: {balances[toCurrency]} {toCurrency}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-xl">
              <span className="text-xl">{getCurrencyIcon(toCurrency)}</span>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="ARBITRUM">ARBITRUM</option>
                <option value="MXNB">MXNB</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
            
            <div className="flex-1 text-right text-xl font-semibold text-white">
              {toAmount || '0.00'}
            </div>
          </div>
        </Card>

        {/* Exchange Rate Info */}
        <Card className="bg-blue-500/20 border-blue-500/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-300 text-sm">Tipo de cambio</span>
            <Button variant="ghost" size="sm" className="text-blue-300 p-1">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white font-semibold">
              1 {fromCurrency} = {getExchangeRate().toFixed(fromCurrency === 'ARBITRUM' ? 2 : 6)} {toCurrency}
            </span>
            <div className="flex items-center text-green-400 text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1%
            </div>
          </div>
        </Card>

        {/* Transaction Details */}
        {fromAmount && toAmount && (
          <Card className="bg-gray-800 border-gray-700 p-4">
            <h3 className="text-white font-medium mb-3">Detalles de la transacción</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Envías</span>
                <span className="text-white">{fromAmount} {fromCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Recibes</span>
                <span className="text-white">{toAmount} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Comisión de red</span>
                <span className="text-green-400">$0.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tiempo estimado</span>
                <span className="text-white">~30 segundos</span>
              </div>
            </div>
          </Card>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!isSwapValid || isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Intercambiando...</span>
            </div>
          ) : (
            `Intercambiar ${fromCurrency} por ${toCurrency}`
          )}
        </Button>

        {/* Warning */}
        <Card className="bg-yellow-500/20 border-yellow-500/30 p-4">
          <h4 className="text-yellow-300 font-medium mb-2">⚠️ Importante</h4>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• Los intercambios son irreversibles</li>
            <li>• Las tasas pueden cambiar antes de la confirmación</li>
            <li>• Los intercambios con ARBITRUM requieren gas fees</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default SwapPage; 