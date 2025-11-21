import React, { useState } from 'react';
import { PrivacyDashboard } from '../components/PrivacyDashboard';
import { Sparkles, Zap, Shield, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { zkProofService } from '../services/zkProofService';
import { sorobanService } from '../services/sorobanService';

export const ZKDemo: React.FC = () => {
  const [balance, setBalance] = useState(600);
  const [targetAmount, setTargetAmount] = useState(500);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [proofId, setProofId] = useState<string | undefined>();
  const [proof, setProof] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [verificationTxHash, setVerificationTxHash] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const handleGenerateProof = async () => {
    setIsGenerating(true);
    setError(undefined);
    setVerified(null);
    
    try {
      // Generar proof real usando el servicio
      const result = await zkProofService.generateProof({
        balance,
        targetAmount,
      });

      setProof(result.proof);
      setProofId(result.proofId);
      setProofGenerated(true);

      // Automáticamente verificar on-chain
      await handleVerifyProof(result.proof, result.publicInputs);
    } catch (err: any) {
      setError(err.message || 'Error generando proof');
      console.error('Error generando proof:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyProof = async (proofToVerify: string, publicInputs: string[]) => {
    setIsVerifying(true);
    setError(undefined);

    try {
      // Verificar en el contrato Soroban
      const verifierAddress = import.meta.env.VITE_ULTRAHONK_VERIFIER_CONTRACT || '';
      
      if (!verifierAddress) {
        throw new Error('VITE_ULTRAHONK_VERIFIER_CONTRACT no está configurado en las variables de entorno');
      }

      const result = await sorobanService.verifyProof(proofToVerify, verifierAddress);

      setVerified(result.verified);
      setVerificationTxHash(result.txHash);
      setProofId(result.proofId);

      if (!result.verified) {
        setError('Proof no verificado por el contrato');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Error verificando proof';
      
      // Mensajes de error más claros
      if (err.message?.includes('NOT_IMPLEMENTED') || err.message?.includes('no implementada')) {
        errorMessage = 'Verificación on-chain no implementada. Por favor, integra el SDK de Soroban (@stellar/stellar-sdk) en el backend.';
      } else if (err.message?.includes('SOROBAN_NOT_CONFIGURED')) {
        errorMessage = 'Soroban no está configurado. Por favor, configura SOROBAN_RPC_URL en las variables de entorno del backend.';
      }
      
      setError(errorMessage);
      setVerified(false);
      console.error('Error verificando proof:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const isGoalAchieved = balance >= targetAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            Demostración de ZK Proofs
          </h1>
          <p className="text-gray-400 text-lg">
            Protege tu privacidad mientras demuestras que alcanzaste tus metas
            financieras
          </p>
        </div>

        {/* Simulador Interactivo */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Simulador de Proofs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Balance Actual (Privado)
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                🔒 Este valor nunca se revelará públicamente
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta de Ahorro (Privada)
              </label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                🔒 Este valor nunca se revelará públicamente
              </p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-300 font-medium mb-1">
                  ¿Qué se puede verificar?
                </p>
                <p className="text-sm text-gray-300">
                  {isGoalAchieved ? (
                    <>
                      ✅ Puedes generar un proof que demuestre:{' '}
                      <strong>balance ≥ meta</strong> sin revelar los valores
                      exactos. Solo se revelará públicamente la diferencia:{' '}
                      <strong>${(balance - targetAmount).toLocaleString()}</strong>
                    </>
                  ) : (
                    <>
                      ❌ No puedes generar un proof porque tu balance ($
                      {balance.toLocaleString()}) es menor que tu meta ($
                      {targetAmount.toLocaleString()})
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateProof}
            disabled={!isGoalAchieved || proofGenerated || isGenerating}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              isGoalAchieved && !proofGenerated && !isGenerating
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando Proof...
              </>
            ) : proofGenerated ? (
              '✅ Proof Generado'
            ) : isGoalAchieved ? (
              '🔐 Generar ZK Proof Real'
            ) : (
              '❌ Meta No Alcanzada'
            )}
          </button>

          {/* Estado de Verificación */}
          {proofGenerated && (
            <div className="mt-4 space-y-2">
              {isVerifying ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  <span className="text-yellow-300">Verificando proof on-chain...</span>
                </div>
              ) : verified !== null ? (
                <div
                  className={`rounded-lg p-4 flex items-start gap-3 ${
                    verified
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  {verified ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-semibold mb-1 ${
                        verified ? 'text-green-300' : 'text-red-300'
                      }`}
                    >
                      {verified
                        ? '✅ Proof Verificado On-Chain'
                        : '❌ Proof No Verificado'}
                    </p>
                    {verified && proofId && (
                      <div className="text-sm text-gray-300 space-y-1">
                        <div>
                          <span className="text-gray-400">Proof ID:</span>{' '}
                          <code className="text-green-400 font-mono text-xs break-all">
                            {proofId}
                          </code>
                        </div>
                        {verificationTxHash && (
                          <div>
                            <span className="text-gray-400">Tx Hash:</span>{' '}
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${verificationTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              {verificationTxHash.slice(0, 20)}...
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <p className="text-green-400 text-xs mt-2">
                          🔒 Este proof es REAL y fue verificado en la blockchain Stellar
                        </p>
                      </div>
                    )}
                    {!verified && error && (
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error && !proofGenerated && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Dashboard de Privacidad */}
        <PrivacyDashboard
          balance={balance}
          targetAmount={targetAmount}
          proofGenerated={proofGenerated}
          proofId={proofId}
          verified={verified}
          verificationTxHash={verificationTxHash}
          proof={proof}
        />

        {/* Información Técnica */}
        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            🔬 Cómo Funciona Técnicamente
          </h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">1.</span>
              <div>
                <strong>Circuito Noir:</strong> Define la lógica de verificación
                (balance ≥ meta) sin revelar valores exactos.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">2.</span>
              <div>
                <strong>Generación Local:</strong> El proof se genera en tu
                dispositivo usando tus datos privados. Los datos nunca salen de
                tu dispositivo.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">3.</span>
              <div>
                <strong>Verificación On-Chain:</strong> El contrato Soroban
                verifica el proof usando Ultrahonk. Solo se envía el proof, no
                tus datos.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">4.</span>
              <div>
                <strong>Recompensas:</strong> Si el proof es válido, puedes
                reclamar badges, descuentos o aparecer en rankings anónimos sin
                revelar tu información.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

