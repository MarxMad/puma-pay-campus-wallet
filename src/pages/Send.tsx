import { useState } from 'react';
import { ArrowLeft, User, Banknote, MessageCircle, QrCode, Camera, Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';
import { Category } from '@/types/categories';

const SendPage = () => {
  const navigate = useNavigate();
  const { getExpenseCategories, addTransaction, addCategory } = useCategories();
  const { available, hasInsufficientFunds } = useBalance();
  const [formData, setFormData] = useState({
    recipient: '',
    walletOrClabe: '',
    amount: '',
    concept: '',
    categoryId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📝',
    color: 'bg-blue-500'
  });

  const expenseCategories = getExpenseCategories();
  const availableIcons = ['📝', '🛍️', '🎯', '⚡', '🔧', '🎨', '🏃‍♂️', '🎪', '🔥', '💻'];
  const availableColors = [
    'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScanQR = () => {
    setShowScanner(true);
    // Aquí implementarías la funcionalidad de escáner QR
    // Por ahora simulo un escaneo exitoso
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        walletOrClabe: '0x742d35Cc6634C0532925a3b8D6Ac0865d2c57b78'
      }));
      setShowScanner(false);
    }, 2000);
  };

  const handleSend = async () => {
    const amount = parseFloat(formData.amount);
    
    // Validar fondos suficientes
    if (hasInsufficientFunds(amount)) {
      alert(`Fondos insuficientes. Tu balance disponible es $${available.toFixed(2)} MXNB`);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`💸 Procesando envío: $${amount} MXNB a ${formData.recipient}`);
      
      // Simular envío de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Registrar la transacción
      addTransaction({
        amount: amount,
        type: 'expense',
        categoryId: formData.categoryId,
        description: formData.concept,
        recipient: formData.recipient,
        currency: 'MXNB'
      });
      
      // Forzar actualización del balance
      setTimeout(() => {
        console.log(`🚀 Forzando eventos después de envío...`);
        window.dispatchEvent(new CustomEvent('forceBalanceUpdate'));
        const timestamp = Date.now();
        localStorage.setItem('pumapay_last_update', timestamp.toString());
        console.log(`⏰ Eventos de envío disparados después de delay`);
      }, 500); // Incrementar delay a 500ms
      
      alert(`✅ ¡Pago enviado exitosamente!
      
💸 Monto: $${amount.toFixed(2)} MXNB
👤 Destinatario: ${formData.recipient}
📝 Concepto: ${formData.concept}
📊 Balance actualizado automáticamente`);
      
      navigate('/home');
    } catch (error) {
      console.error('Error al enviar pago:', error);
      alert('Error al enviar el pago. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      addCategory({
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
        type: 'expense'
      });
      setNewCategory({ name: '', icon: '📝', color: 'bg-blue-500' });
      setShowCategoryModal(false);
    }
  };

  const isFormValid = formData.recipient && formData.walletOrClabe && formData.amount && formData.concept && formData.categoryId;

  if (showScanner) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between p-4 text-white">
          <Button variant="ghost" size="sm" onClick={() => setShowScanner(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Escanear QR</h1>
          <div></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="bg-gray-800 border-gray-700 p-8 text-center">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Escaneando QR...</h3>
            <p className="text-gray-400">Enfoca el código QR del destinatario</p>
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Enviar Pago</h1>
        <div></div>
      </div>

      <div className="p-4 space-y-6">
        {/* Destinatario */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <Label className="text-white text-sm font-medium mb-2 block">
            Número de cuenta del estudiante
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Ej: 420123456, juan.perez@alumno.unam.mx"
              value={formData.recipient}
              onChange={(e) => handleInputChange('recipient', e.target.value)}
              className="pl-10 rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </Card>

        {/* Wallet/CLABE */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <Label className="text-white text-sm font-medium mb-2 block">
            Wallet o CLABE
          </Label>
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="0x... o 18 dígitos CLABE"
                value={formData.walletOrClabe}
                onChange={(e) => handleInputChange('walletOrClabe', e.target.value)}
                className="rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Button
              onClick={handleScanQR}
              className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Balance disponible */}
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Balance disponible</span>
            <span className="text-white font-semibold text-lg">
              ${available.toFixed(2)} MXNB
            </span>
          </div>
        </Card>

        {/* Monto */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <Label className="text-white text-sm font-medium mb-2 block">
            Monto
          </Label>
          <div className="relative">
            <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={`pl-10 rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-lg ${
                formData.amount && hasInsufficientFunds(parseFloat(formData.amount)) 
                  ? 'border-red-500' : ''
              }`}
            />
          </div>
          
          {/* Advertencia de fondos insuficientes */}
          {formData.amount && hasInsufficientFunds(parseFloat(formData.amount)) && (
            <p className="text-red-400 text-sm mt-2">
              ⚠️ Fondos insuficientes. Reduce el monto o deposita más fondos.
            </p>
          )}
          
          <div className="flex space-x-2 mt-3">
            {['50', '100', '250', '500'].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => handleInputChange('amount', amount)}
                disabled={hasInsufficientFunds(parseFloat(amount))}
                className={`rounded-lg border-gray-600 text-gray-300 hover:bg-gray-700 ${
                  hasInsufficientFunds(parseFloat(amount)) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </Card>

        {/* Concepto */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <Label className="text-white text-sm font-medium mb-2 block">
            Concepto
          </Label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Ej: Cafetería, Libros, Transporte..."
              value={formData.concept}
              onChange={(e) => handleInputChange('concept', e.target.value)}
              className="pl-10 rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </Card>

        {/* Categoría */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white text-sm font-medium">
              Categoría del gasto
            </Label>
            <Button
              onClick={() => setShowCategoryModal(true)}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {expenseCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => handleInputChange('categoryId', category.id)}
                variant={formData.categoryId === category.id ? "default" : "outline"}
                className={`p-3 rounded-xl flex items-center space-x-2 ${
                  formData.categoryId === category.id 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </Button>
            ))}
          </div>
          
          {formData.categoryId && (
            <div className="mt-3 p-3 bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  Categoría seleccionada: 
                  <span className="text-white font-medium ml-1">
                    {expenseCategories.find(c => c.id === formData.categoryId)?.name}
                  </span>
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Resumen */}
        {formData.amount && (
          <Card className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30 p-6">
            <h3 className="text-white font-semibold mb-2">Resumen del envío</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Para:</span>
                <span className="text-white">{formData.recipient || 'Sin especificar'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Monto:</span>
                <span className="text-white font-semibold">${formData.amount} MXNB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Comisión:</span>
                <span className="text-green-400">$0.00</span>
              </div>
            </div>
          </Card>
        )}

        {/* Botón de envío */}
        <Button
          onClick={handleSend}
          disabled={!isFormValid || isLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-lg font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Enviando...</span>
            </div>
          ) : (
            `Enviar $${formData.amount || '0.00'} MXNB`
          )}
        </Button>
      </div>

      {/* Modal para agregar nueva categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Nueva Categoría</h2>
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
                  placeholder="Ej: Gimnasio, Café, Ropa..."
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
                          ? 'bg-orange-500 hover:bg-orange-600' 
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
                  className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl"
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

export default SendPage; 