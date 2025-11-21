import React, { useState } from 'react';
import { Lock, CheckCircle, Eye, EyeOff, Shield, ExternalLink } from 'lucide-react';

interface PrivacyDashboardProps {
  balance?: number;
  targetAmount?: number;
  proofGenerated?: boolean;
  proofId?: string;
  verified?: boolean | null;
  verificationTxHash?: string;
  proof?: string;
}

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({
  balance = 600,
  targetAmount = 500,
  proofGenerated = false,
  proofId,
  verified = null,
  verificationTxHash,
  proof,
}) => {
  const [showPrivateData, setShowPrivateData] = useState(false);
  const difference = balance - targetAmount;
  const isGoalAchieved = balance >= targetAmount;

  const privacyLevel = proofGenerated ? 3 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          Dashboard de Privacidad ZK
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Nivel de Privacidad:</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((level) => (
              <Lock
                key={level}
                className={`w-5 h-5 ${
                  level <= privacyLevel
                    ? 'text-green-400 fill-green-400'
                    : 'text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos Privados */}
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-red-500/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Datos Privados
            </h3>
            <button
              onClick={() => setShowPrivateData(!showPrivateData)}
              className="text-gray-400 hover:text-white transition"
            >
              {showPrivateData ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Estos datos NUNCA se revelan públicamente
          </p>
          <div className="space-y-3">
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Balance Exacto</div>
              <div className="text-lg font-mono text-red-300">
                {showPrivateData ? `$${balance.toLocaleString()}` : '🔒 Privado'}
              </div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Meta de Ahorro</div>
              <div className="text-lg font-mono text-red-300">
                {showPrivateData
                  ? `$${targetAmount.toLocaleString()}`
                  : '🔒 Privado'}
              </div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">
                Historial de Transacciones
              </div>
              <div className="text-sm text-gray-400">🔒 Privado</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Identidad Completa</div>
              <div className="text-sm text-gray-400">🔒 Privado</div>
            </div>
          </div>
        </div>

        {/* Datos Públicos */}
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-green-500/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Datos Públicos
            </h3>
            {proofGenerated && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                Verificado
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Solo lo mínimo necesario para verificación
          </p>
          <div className="space-y-3">
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Meta Alcanzada</div>
              <div className="text-lg font-semibold text-green-400">
                {isGoalAchieved ? '✅ Sí' : '❌ No'}
              </div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Diferencia</div>
              <div className="text-lg font-mono text-green-300">
                ${difference.toLocaleString()}
              </div>
            </div>
            {proofId && (
              <div className="bg-gray-900 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Proof ID</div>
                <div className="text-xs font-mono text-green-300 break-all">
                  {proofId}
                </div>
              </div>
            )}
            {proof && (
              <div className="bg-gray-900 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Proof (Hex)</div>
                <div className="text-xs font-mono text-green-300 break-all">
                  {proof.slice(0, 40)}...
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Longitud: {proof.length} caracteres
                </p>
              </div>
            )}
            <div className="bg-gray-900 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">
                Verificado On-Chain
              </div>
              <div className="text-sm">
                {verified === true ? (
                  <span className="text-green-400 flex items-center gap-1">
                    ✅ Sí (Verificado en Stellar)
                  </span>
                ) : verified === false ? (
                  <span className="text-red-400">❌ No</span>
                ) : proofGenerated ? (
                  <span className="text-yellow-400">⏳ Verificando...</span>
                ) : (
                  <span className="text-gray-400">⏳ Pendiente</span>
                )}
              </div>
              {verificationTxHash && (
                <div className="mt-2 text-xs">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${verificationTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Ver transacción
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparativa */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Comparativa: Sistema Tradicional vs. ZK Proofs
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
            <div className="text-red-400 font-semibold mb-2">
              ❌ Sistema Tradicional
            </div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Balance: ${balance}</li>
              <li>• Meta: ${targetAmount}</li>
              <li>• Historial completo expuesto</li>
              <li>• Identidad vinculada</li>
            </ul>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
            <div className="text-green-400 font-semibold mb-2">
              ✅ PumaPay con ZK
            </div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Solo: Meta alcanzada ✅</li>
              <li>• Solo: Diferencia ${difference}</li>
              <li>• Historial protegido 🔒</li>
              <li>• Identidad anónima 🔒</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>💡 Cómo funciona:</strong> Los ZK Proofs permiten verificar
          que cumpliste tu meta de ahorro sin revelar tu balance exacto. El
          proof se genera en tu dispositivo y solo se envía la prueba
          verificable, nunca tus datos privados.
        </p>
      </div>
    </div>
  );
};

