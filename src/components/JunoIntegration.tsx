import React, { useState, useEffect } from 'react';
import { junoService, JunoService } from '../services/junoService';
import type { BankAccount, CLABEDetails, Transaction } from '../config/backend';
import { useAuth } from '@/contexts/AuthContext';

interface JunoIntegrationProps {
  className?: string;
}

/**
 * Componente de ejemplo para integración con Juno
 * Este componente demuestra cómo usar las APIs de Juno desde el frontend
 */
export const JunoIntegration: React.FC<JunoIntegrationProps> = ({ className = '' }) => {
  // Estados
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [clabes, setClabes] = useState<CLABEDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<boolean>(false);

  // Estados para formularios
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [redeemAmount, setRedeemAmount] = useState<string>('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');

  // Estados para registro de cuenta bancaria
  const [newBankForm, setNewBankForm] = useState({
    tag: '',
    recipient_legal_name: '',
    clabe: '',
    ownership: 'COMPANY_OWNED' as 'COMPANY_OWNED' | 'THIRD_PARTY'
  });

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      // Verificar estado del backend
      const isAvailable = await junoService.isBackendAvailable();
      setBackendStatus(isAvailable);

      if (isAvailable) {
        // Cargar datos en paralelo
        const [balanceData, transactionsData, bankAccountsData, clabesData] = await Promise.all([
          junoService.getMXNBBalance(),
          junoService.getTransactions({ limit: 10 }),
          junoService.getBankAccounts(),
          junoService.getAccountDetails()
        ]);

        setBalance(balanceData);
        setTransactions(transactionsData);
        setBankAccounts(bankAccountsData);
        setClabes(clabesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
      console.error('Error cargando datos iniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear depósito mock para testing
   */
  const handleMockDeposit = async () => {
    if (!depositAmount || !user?.clabe || !user?.name) return;
    setLoading(true);
    setError('');
    try {
      const result = await junoService.createMockDeposit({
        amount: parseFloat(depositAmount),
        receiver_clabe: user.clabe,
        receiver_name: user.name,
        sender_name: user.name
      });
      console.log('Depósito mock creado:', result);
      setTimeout(() => {
        loadInitialData();
      }, 2000);
      setDepositAmount('');
      alert('Depósito mock creado exitosamente. El balance se actualizará en unos momentos.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando depósito');
      console.error('Error creando depósito mock:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Redimir tokens MXNB
   */
  const handleRedemption = async () => {
    if (!redeemAmount || !selectedBankAccount) return;

    setLoading(true);
    setError('');

    try {
      const result = await junoService.redeemMXNB({
        amount: parseFloat(redeemAmount),
        destination_bank_account_id: selectedBankAccount
      });

      console.log('Redención iniciada:', result);
      
      // Recargar datos
      await loadInitialData();

      setRedeemAmount('');
      alert('Redención iniciada exitosamente. Revisa tu cuenta bancaria en unos minutos.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando redención');
      console.error('Error en redención:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registrar nueva cuenta bancaria
   */
  const handleRegisterBank = async () => {
    if (!newBankForm.tag || !newBankForm.recipient_legal_name || !newBankForm.clabe) return;

    // Validar CLABE
    if (!JunoService.validateCLABE(newBankForm.clabe)) {
      setError('CLABE inválida. Debe tener 18 dígitos y pasar la validación.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await junoService.registerBankAccount(newBankForm);
      console.log('Cuenta bancaria registrada:', result);
      
      // Recargar cuentas bancarias
      const updatedBankAccounts = await junoService.getBankAccounts();
      setBankAccounts(updatedBankAccounts);

      // Limpiar formulario
      setNewBankForm({
        tag: '',
        recipient_legal_name: '',
        clabe: '',
        ownership: 'COMPANY_OWNED'
      });

      alert('Cuenta bancaria registrada exitosamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error registrando cuenta');
      console.error('Error registrando cuenta bancaria:', err);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  return (
    <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Integración con Juno APIs</h2>

      {/* Estado del Backend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Estado del Backend</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${backendStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{backendStatus ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Balance */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Balance MXNB</h3>
        <p className="text-2xl font-bold text-blue-600">
          {JunoService.formatMXNB(balance)}
        </p>
      </div>

      {/* CLABEs para Depósito */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">CLABEs para Depósito</h3>
        {clabes.length > 0 ? (
          <div className="space-y-2">
            {clabes.map((clabe, index) => (
              <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-mono text-lg">{JunoService.formatCLABE(clabe.clabe)}</p>
                <p className="text-sm text-gray-600">Tipo: {clabe.type} - Estado: {clabe.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay CLABEs disponibles</p>
        )}
      </div>

      {/* Depósito Mock (Solo Testing) */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Crear Depósito Mock (Testing)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Monto (mínimo 100 MXN)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="flex-1 p-2 border rounded"
            min="100"
          />
          <button
            onClick={handleMockDeposit}
            disabled={loading || !depositAmount || parseFloat(depositAmount) < 100 || !user?.clabe || !user?.name}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Crear Depósito
          </button>
        </div>
      </div>

      {/* Cuentas Bancarias */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Cuentas Bancarias Registradas</h3>
        {bankAccounts.length > 0 ? (
          <div className="space-y-2">
            {bankAccounts.map((account) => (
              <div key={account.id} className="p-3 border rounded">
                <p className="font-semibold">{account.tag}</p>
                <p className="text-sm text-gray-600">{account.recipient_legal_name}</p>
                <p className="font-mono">{JunoService.formatCLABE(account.clabe)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay cuentas bancarias registradas</p>
        )}
      </div>

      {/* Registrar Nueva Cuenta Bancaria */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Registrar Nueva Cuenta Bancaria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Nombre de la cuenta"
            value={newBankForm.tag}
            onChange={(e) => setNewBankForm(prev => ({ ...prev, tag: e.target.value }))}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Nombre legal del beneficiario"
            value={newBankForm.recipient_legal_name}
            onChange={(e) => setNewBankForm(prev => ({ ...prev, recipient_legal_name: e.target.value }))}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="CLABE (18 dígitos)"
            value={newBankForm.clabe}
            onChange={(e) => setNewBankForm(prev => ({ ...prev, clabe: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
            className="p-2 border rounded"
          />
          <select
            value={newBankForm.ownership}
            onChange={(e) => setNewBankForm(prev => ({ ...prev, ownership: e.target.value as any }))}
            className="p-2 border rounded"
          >
            <option value="COMPANY_OWNED">Propia de la Empresa</option>
            <option value="THIRD_PARTY">Tercero</option>
          </select>
        </div>
        <button
          onClick={handleRegisterBank}
          disabled={loading || !newBankForm.tag || !newBankForm.recipient_legal_name || !newBankForm.clabe}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Registrar Cuenta
        </button>
      </div>

      {/* Redimir MXNB */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Redimir MXNB</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="number"
            placeholder="Monto a redimir (mínimo 100)"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            className="p-2 border rounded"
            min="100"
          />
          <select
            value={selectedBankAccount}
            onChange={(e) => setSelectedBankAccount(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Seleccionar cuenta bancaria</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.tag} - {JunoService.formatCLABE(account.clabe)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRedemption}
          disabled={loading || !redeemAmount || !selectedBankAccount || parseFloat(redeemAmount) < 100}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Redimir
        </button>
      </div>

      {/* Transacciones Recientes */}
      <div>
        <h3 className="font-semibold mb-3">Transacciones Recientes</h3>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{tx.transaction_type}</p>
                    <p className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleString()}</p>
                    <p className="text-sm">Estado: {tx.summary_status}</p>
                  </div>
                  <p className="font-bold text-lg">{JunoService.formatMXNB(tx.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay transacciones recientes</p>
        )}
      </div>

      {/* Botón de Actualizar */}
      <div className="mt-6">
        <button
          onClick={loadInitialData}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Actualizar Datos'}
        </button>
      </div>
    </div>
  );
}; 