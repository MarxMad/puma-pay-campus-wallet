import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Trash2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { portalService } from '@/services/portal';

const DebugPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    // Verificar si el debug mode está activo
    const isDebugActive = localStorage.getItem('pumapay_debug_mode') === 'true';
    setDebugMode(isDebugActive);

    // Cargar información del localStorage
    loadLocalStorageData();

    // Cargar información de Portal MPC
    loadPortalInfo();
  }, []);

  const loadLocalStorageData = () => {
    const data: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pumapay_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(data);
  };

  const loadPortalInfo = async () => {
    try {
      const balance = await portalService.getMXNBBalance();
      const info = {
        balance,
        isInitialized: true,
        // Aquí podrías agregar más información del Portal
      };
      setPortalInfo(info);
    } catch (error) {
      setPortalInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    
    if (newMode) {
      localStorage.setItem('pumapay_debug_mode', 'true');
    } else {
      localStorage.removeItem('pumapay_debug_mode');
    }
  };

  const clearAllData = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos? Esto cerrará tu sesión.')) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('pumapay_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  const resetDataToZero = () => {
    if (confirm('¿Quieres resetear balance y transacciones a cero? (mantendrá categorías y configuración)')) {
      // Resetear balance a cero
      const zeroBalance = {
        balance: 0,
        available: 0,
        isLoading: false,
        lastUpdated: new Date()
      };
      localStorage.setItem('pumapay_mxnb_balance', JSON.stringify(zeroBalance));

      // Resetear transacciones (array vacío)
      localStorage.setItem('pumapay_transactions', JSON.stringify([]));

      // Resetear presupuesto global
      const resetBudget = {
        monthlyLimit: 2500,
        currentSpent: 0,
        month: new Date().toISOString().slice(0, 7)
      };
      localStorage.setItem('pumapay_global_budget', JSON.stringify(resetBudget));

      alert('✅ Datos reseteados: Balance en $0, sin transacciones, presupuesto limpio');
      loadLocalStorageData();
      
      // Recargar la página para ver los cambios
      setTimeout(() => {
        window.location.href = '/home';
      }, 1000);
    }
  };

  const forceCompleteReset = () => {
    if (confirm('⚠️ RESET COMPLETO: Esto borrará TODO y empezará desde cero. ¿Continuar?')) {
      // Borrar TODOS los datos de PumaPay
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('pumapay_') || key.includes('puma') || key.includes('balance')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Establecer datos iniciales limpios forzosamente
      const zeroBalance = {
        balance: 0,
        available: 0,
        isLoading: false,
        lastUpdated: new Date()
      };
      localStorage.setItem('pumapay_mxnb_balance', JSON.stringify(zeroBalance));
      localStorage.setItem('pumapay_transactions', JSON.stringify([]));
      
      const cleanBudget = {
        monthlyLimit: 2500,
        currentSpent: 0,
        month: new Date().toISOString().slice(0, 7)
      };
      localStorage.setItem('pumapay_global_budget', JSON.stringify(cleanBudget));
      
      // Marcar como recién inicializado
      localStorage.setItem('pumapay_initialized', 'true');
      localStorage.setItem('pumapay_force_reset', Date.now().toString());

      alert('🎉 RESET COMPLETO EXITOSO: Todo limpio, balance en $0.00');
      
      // Forzar recarga completa
      window.location.href = '/home';
    }
  };

  // Función para asegurar datos limpios en primer inicio
  const ensureCleanStart = () => {
    const hasInitialized = localStorage.getItem('pumapay_initialized');
    
    if (!hasInitialized) {
      // Es la primera vez, asegurar datos limpios
      const zeroBalance = {
        balance: 0,
        available: 0,
        isLoading: false,
        lastUpdated: new Date()
      };
      localStorage.setItem('pumapay_mxnb_balance', JSON.stringify(zeroBalance));
      localStorage.setItem('pumapay_transactions', JSON.stringify([]));
      
      const resetBudget = {
        monthlyLimit: 2500,
        currentSpent: 0,
        month: new Date().toISOString().slice(0, 7)
      };
      localStorage.setItem('pumapay_global_budget', JSON.stringify(resetBudget));
      localStorage.setItem('pumapay_initialized', 'true');
      
      alert('🎉 ¡Bienvenido a PumaPay Campus! Tu wallet ha sido inicializada con balance $0.00');
    }
  };

  const exportData = () => {
    const data = {
      user,
      localStorageData,
      portalInfo,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pumapay_debug_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-red-900">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">🔧 Debug Panel</h1>
        <div className="text-xs">DEV ONLY</div>
      </div>

      <div className="p-4 space-y-6">
        {/* Advertencia */}
        <Card className="bg-red-900/20 border-red-500 p-4">
          <h3 className="text-red-400 font-semibold mb-2">⚠️ Panel de Desarrollador</h3>
          <p className="text-red-300 text-sm">
            Esta página es solo para desarrolladores. Los usuarios finales no deberían tener acceso a esta información.
          </p>
        </Card>

        {/* Control de Debug Mode */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold">Modo Debug</h3>
            <Button
              onClick={toggleDebugMode}
              className={`${debugMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} rounded-xl`}
            >
              {debugMode ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {debugMode ? 'Activo' : 'Inactivo'}
            </Button>
          </div>
          <p className="text-gray-300 text-sm">
            {debugMode 
              ? 'El AuthStatus es visible en todas las páginas'
              : 'El AuthStatus está oculto para los usuarios'
            }
          </p>
        </Card>

        {/* Estado de Autenticación */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">🔐 Estado de Autenticación</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Loading:</span>
              <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
                {isLoading ? '⏳ Cargando...' : '✅ Listo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Authenticated:</span>
              <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                {isAuthenticated ? '✅ Autenticado' : '❌ No autenticado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">User:</span>
              <span className={user ? 'text-green-400' : 'text-red-400'}>
                {user ? '✅ Presente' : '❌ No presente'}
              </span>
            </div>
          </div>

          {user && (
            <div className="mt-4 p-4 bg-gray-700 rounded-xl">
              <h4 className="text-white font-medium mb-2">Datos del Usuario:</h4>
              <div className="space-y-1 text-xs font-mono">
                <div><span className="text-gray-400">Email:</span> {user.email || 'N/A'}</div>
                <div><span className="text-gray-400">Nombre:</span> {user.name || 'N/A'}</div>
                <div><span className="text-gray-400">Dirección:</span> {user.address}</div>
                <div><span className="text-gray-400">Método:</span> {user.authMethod}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Información de Portal MPC */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold">🌐 Portal MPC</h3>
            <Button
              onClick={loadPortalInfo}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
          
          {portalInfo ? (
            <div className="p-4 bg-gray-700 rounded-xl">
              <pre className="text-xs text-gray-300 overflow-auto">
                {JSON.stringify(portalInfo, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Cargando información...</div>
          )}
        </Card>

        {/* LocalStorage Data */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold">💾 LocalStorage</h3>
            <Button
              onClick={loadLocalStorageData}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
          
          <div className="p-4 bg-gray-700 rounded-xl max-h-60 overflow-auto">
            <pre className="text-xs text-gray-300">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </div>
        </Card>

        {/* Acciones */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">🔧 Acciones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={exportData}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Datos
            </Button>
            <Button
              onClick={resetDataToZero}
              className="bg-yellow-600 hover:bg-yellow-700 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset a Cero
            </Button>
            <Button
              onClick={forceCompleteReset}
              className="bg-orange-600 hover:bg-orange-700 rounded-xl"
            >
              <span className="mr-2">🚨</span>
              Reset Completo
            </Button>
            <Button
              onClick={ensureCleanStart}
              className="bg-green-600 hover:bg-green-700 rounded-xl"
            >
              <span className="mr-2">🎉</span>
              Inicializar Limpio
            </Button>
            <Button
              onClick={clearAllData}
              variant="destructive"
              className="rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Todo
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-700 rounded-xl">
            <p className="text-gray-300 text-sm">
              <strong>Reset a Cero:</strong> Mantiene categorías, solo limpia balance y transacciones<br/>
              <strong>Reset Completo:</strong> Borra TODO y fuerza balance en $0.00<br/>
              <strong>Inicializar Limpio:</strong> Solo si es la primera vez
            </p>
          </div>
        </Card>

        {/* Información del Sistema */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">ℹ️ Información del Sistema</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">User Agent:</span>
              <span className="text-white text-xs">{navigator.userAgent.slice(0, 50)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">URL Actual:</span>
              <span className="text-white text-xs">{window.location.href}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Timestamp:</span>
              <span className="text-white text-xs">{new Date().toISOString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DebugPage; 