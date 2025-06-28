import { useState } from 'react';
import { ArrowLeft, QrCode, Copy, Share2, Banknote, Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';

const ReceivePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getIncomeCategories, addTransaction, addCategory } = useCategories();
  const { available } = useBalance();
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'MXNB' | 'MXN' | 'ARBITRUM'>('MXNB');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '💰',
    color: 'bg-green-500'
  });

  const incomeCategories = getIncomeCategories();
  const availableIcons = ['💰', '🎓', '💼', '🎁', '📈', '💎', '🏆', '⭐', '🌟', '🔥'];
  const availableColors = [
    'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-yellow-500', 'bg-teal-500', 'bg-cyan-500'
  ];

  // Datos simulados del usuario (en producción vendrían del contexto/API)
  const walletData = {
    MXNB: '0x742d35Cc6634C0532925a3b8D6Ac0865d2c57b78',
    MXN: '032180012345678901', // CLABE simulada
    ARBITRUM: '0x742d35Cc6634C0532925a3b8D6Ac0865d2c57b78'
  };

  const generateQRData = () => {
    const data = {
      address: walletData[selectedCurrency],
      amount: amount || '0',
      concept: concept || '',
      currency: selectedCurrency,
      categoryId: categoryId,
      studentId: user?.address || 'unknown'
    };
    return JSON.stringify(data);
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      addCategory({
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
        type: 'income'
      });
      setNewCategory({ name: '', icon: '💰', color: 'bg-green-500' });
      setShowCategoryModal(false);
    }
  };

  const handlePaymentReceived = () => {
    if (!amount || !categoryId) {
      alert('Por favor, ingresa un monto y selecciona una categoría para recibir el pago.');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Por favor, ingresa un monto válido mayor a 0.');
      return;
    }

    console.log(`💰 Procesando pago recibido: $${paymentAmount} ${selectedCurrency}`);
    
    // Registrar la transacción
    addTransaction({
      amount: paymentAmount,
      type: 'income',
      categoryId: categoryId,
      description: concept || `Pago recibido ${selectedCurrency}`,
      currency: selectedCurrency,
      recipient: 'Pago recibido'
    });
    
    // Forzar actualización del balance con multiple métodos
    setTimeout(() => {
      console.log(`🚀 Forzando eventos después de agregar transacción...`);
      window.dispatchEvent(new CustomEvent('forceBalanceUpdate'));
      // También forzar un cambio en localStorage para triggear cualquier listener
      const timestamp = Date.now();
      localStorage.setItem('pumapay_last_update', timestamp.toString());
      console.log(`⏰ Eventos disparados después de delay`);
    }, 500); // Incrementar delay a 500ms
    
    // Feedback exitoso y redirección
    alert(`✅ ¡Pago recibido exitosamente!
    
💰 Monto: $${paymentAmount.toFixed(2)} ${selectedCurrency}
📝 Concepto: ${concept || 'Pago recibido'}
📊 Balance actualizado automáticamente en todas las páginas`);
    
    // Limpiar campos y regresar al home
    setAmount('');
    setConcept('');
    setCategoryId('');
    navigate('/home');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const shareQR = async () => {
    const text = `Pagar a ${user?.email || 'Usuario'}: ${walletData[selectedCurrency]}${amount ? ` - Monto: $${amount} ${selectedCurrency}` : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PumaPay - Solicitud de pago',
          text: text,
        });
      } catch (error) {
        console.error('Error al compartir:', error);
      }
    } else {
      copyToClipboard(text);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Recibir Pago</h1>
        <div></div>
      </div>

      <div className="p-4 space-y-6">
        {/* Balance actual */}
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Balance actual</span>
            <span className="text-white font-semibold text-lg">
              ${available.toFixed(2)} MXNB
            </span>
          </div>
        </Card>

        {/* Selector de moneda */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <Label className="text-white text-sm font-medium mb-3 block">
            Tipo de pago a recibir
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {(['MXNB', 'MXN', 'ARBITRUM'] as const).map((currency) => (
              <Button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                variant={selectedCurrency === currency ? "default" : "outline"}
                className={`rounded-xl py-3 ${
                  selectedCurrency === currency 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {currency}
              </Button>
            ))}
          </div>
        </Card>

        {/* Monto opcional */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <Label className="text-white text-sm font-medium mb-2 block">
            Monto específico (opcional)
          </Label>
          <div className="relative">
            <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              step="0.01"
              placeholder="Dejar vacío para monto libre"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </Card>

        {/* Concepto opcional */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <Label className="text-white text-sm font-medium mb-2 block">
            Concepto (opcional)
          </Label>
          <Input
            type="text"
            placeholder="Ej: Comida, Préstamo, etc."
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className="rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </Card>

        {/* Categoría de ingreso */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white text-sm font-medium">
              Categoría del ingreso
            </Label>
            <Button
              onClick={() => setShowCategoryModal(true)}
              variant="ghost"
              size="sm"
              className="text-green-400 hover:text-green-300"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {incomeCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setCategoryId(category.id)}
                variant={categoryId === category.id ? "default" : "outline"}
                className={`p-3 rounded-xl flex items-center space-x-2 ${
                  categoryId === category.id 
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </Button>
            ))}
          </div>
          
          {categoryId && (
            <div className="mt-3 p-3 bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  Categoría seleccionada: 
                  <span className="text-white font-medium ml-1">
                    {incomeCategories.find(c => c.id === categoryId)?.name}
                  </span>
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* QR Code */}
        <Card className="bg-gray-800 border-gray-700 p-6 text-center">
          <h3 className="text-white text-lg font-semibold mb-4">Tu código QR</h3>
          
          {/* Simulación del QR Code */}
          <div className="bg-white p-6 rounded-2xl mx-auto mb-4 w-64 h-64 flex items-center justify-center">
            <div className="text-center">
              <QrCode className="h-32 w-32 text-gray-800 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Código QR para {selectedCurrency}</p>
            </div>
          </div>

          {/* Información de la dirección */}
          <div className="bg-gray-700 p-4 rounded-xl mb-4">
            <p className="text-gray-300 text-xs mb-1">
              {selectedCurrency === 'MXN' ? 'CLABE:' : 'Dirección:'}
            </p>
            <p className="text-white font-mono text-sm break-all">
              {walletData[selectedCurrency]}
            </p>
          </div>

          {amount && (
            <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-xl mb-4">
              <p className="text-red-300 text-sm">
                Solicitando: <span className="font-semibold">${amount} {selectedCurrency}</span>
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex space-x-3 mb-4">
            <Button
              onClick={() => copyToClipboard(walletData[selectedCurrency])}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
            <Button
              onClick={shareQR}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>


        </Card>

        {/* Información adicional */}
        <Card className="bg-blue-500/20 border-blue-500/30 p-4">
          <h4 className="text-blue-300 font-medium mb-2">💡 Consejos</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Comparte este QR para recibir pagos instantáneos</li>
            <li>• {selectedCurrency === 'MXN' ? 'Los pagos en MXN se procesan a través del sistema bancario' : 'Los pagos en blockchain son inmediatos'}</li>
            <li>• Puedes especificar un monto o dejarlo libre</li>
          </ul>
        </Card>

        {/* Funcionalidad de recibir pago */}
        {amount && categoryId && (
          <Card className="bg-green-500/20 border-green-500/30 p-4">
            <h4 className="text-green-300 font-medium mb-3">✅ Listo para recibir</h4>
            <p className="text-green-200 text-sm mb-3">
              Cuando recibas el pago de ${amount} {selectedCurrency}, haz clic para registrarlo.
            </p>
            <Button
              onClick={handlePaymentReceived}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3"
            >
              ✅ Confirmar pago recibido de ${amount} {selectedCurrency}
            </Button>
          </Card>
        )}

        {!amount || !categoryId ? (
          <Card className="bg-blue-500/20 border-blue-500/30 p-4">
            <h4 className="text-blue-300 font-medium mb-2">💡 Para recibir un pago</h4>
            <div className="space-y-2 text-blue-200 text-sm">
              <div className={`flex items-center space-x-2 ${amount ? 'opacity-50' : ''}`}>
                <span className={amount ? '✅' : '📝'}></span>
                <span>Especifica el monto que esperas recibir</span>
              </div>
              <div className={`flex items-center space-x-2 ${categoryId ? 'opacity-50' : ''}`}>
                <span className={categoryId ? '✅' : '📂'}></span>
                <span>Selecciona la categoría del ingreso</span>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <span>📱</span>
                <span>Comparte el QR o tu dirección</span>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <span>✅</span>
                <span>Confirma cuando recibas el pago</span>
              </div>
            </div>
            {amount && categoryId && (
              <div className="mt-3 p-2 bg-green-500/20 rounded-lg">
                <p className="text-green-300 text-xs">
                  ✅ Todo listo. Comparte tu información y confirma cuando recibas el pago.
                </p>
              </div>
            )}
          </Card>
        ) : null}
      </div>

      {/* Modal para agregar nueva categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Nueva Categoría de Ingreso</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">
                  Nombre de la categoría
                </Label>
                <Input
                  type="text"
                  placeholder="Ej: Freelance, Venta, Propina..."
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Icono */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">
                  Icono
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {availableIcons.map((icon) => (
                    <Button
                      key={icon}
                      onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                      variant={newCategory.icon === icon ? "default" : "outline"}
                      className={`p-3 rounded-xl ${
                        newCategory.icon === icon 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">
                  Color
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {availableColors.map((color) => (
                    <Button
                      key={color}
                      onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                      className={`w-12 h-12 rounded-xl ${color} ${
                        newCategory.color === color ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      {newCategory.color === color && <span className="text-white">✓</span>}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Vista previa */}
              <div className="bg-gray-700 p-4 rounded-xl">
                <Label className="text-white text-sm font-medium mb-2 block">
                  Vista previa
                </Label>
                <div className={`${newCategory.color} p-3 rounded-xl flex items-center space-x-2 w-fit`}>
                  <span className="text-lg">{newCategory.icon}</span>
                  <span className="text-white font-medium">
                    {newCategory.name || 'Nueva categoría'}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowCategoryModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddCategory}
                  disabled={!newCategory.name.trim()}
                  className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl"
                >
                  Crear Categoría
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReceivePage; 