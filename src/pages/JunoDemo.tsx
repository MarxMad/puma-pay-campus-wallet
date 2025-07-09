import React from 'react';
import { JunoIntegration } from '../components/JunoIntegration';

/**
 * Página de demo para mostrar la integración con Juno APIs
 * Esta página permite probar todas las funcionalidades de issuance y redemption
 */
export const JunoDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PumaPay Campus - Demo Juno APIs
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Esta página demuestra la integración completa con las APIs de Juno para 
            issuance (minteo) y redemption (canje) de tokens MXNB. Aquí puedes probar 
            todas las funcionalidades antes de integrarlas en la aplicación principal.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Configuración Requerida</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Asegúrate de que el backend esté ejecutándose en puerto 4000</p>
            <p>• Configura las API keys de Juno en el archivo .env del backend</p>
            <p>• Ejecuta: <code className="bg-yellow-100 px-1 rounded">cd backend && npm run dev</code></p>
            <p>• Esta página funciona solo en environment de testing (stage)</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">🚀 Funcionalidades Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-semibold mb-1">Issuance (Minteo):</h4>
              <ul className="space-y-1">
                <li>• Consultar CLABEs para depósitos</li>
                <li>• Crear depósitos mock (testing)</li>
                <li>• Ver balance de MXNB en tiempo real</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Redemption (Canje):</h4>
              <ul className="space-y-1">
                <li>• Registrar cuentas bancarias</li>
                <li>• Redimir tokens MXNB a pesos</li>
                <li>• Historial de transacciones</li>
              </ul>
            </div>
          </div>
        </div>

        <JunoIntegration />

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">📋 Próximos Pasos para Integración</h3>
          <div className="text-sm text-gray-700 space-y-3">
            <div>
              <h4 className="font-semibold">1. Integrar en la App Principal:</h4>
              <p>Una vez que pruebes que todo funciona aquí, puedes integrar estas funcionalidades en las páginas principales de PumaPay Campus.</p>
            </div>
            <div>
              <h4 className="font-semibold">2. Reemplazar Portal SDK:</h4>
              <p>Gradualmente reemplaza las llamadas a Portal SDK con las nuevas APIs de Juno para obtener datos 100% reales del blockchain.</p>
            </div>
            <div>
              <h4 className="font-semibold">3. Configurar Webhooks:</h4>
              <p>Configura los webhooks de Juno para recibir notificaciones en tiempo real de depósitos y redenciones.</p>
            </div>
            <div>
              <h4 className="font-semibold">4. Deployment:</h4>
              <p>Despliega el backend en Vercel y configura las variables de entorno de producción.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Volver a PumaPay Campus
          </a>
        </div>
      </div>
    </div>
  );
}; 