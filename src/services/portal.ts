// Portal MPC Service para MXNB en Arbitrum
// Integración con Portal Web SDK oficial
// Documentación: https://docs.portalhq.io/guides/web

import Portal from '@portal-hq/web';

// Configuración para MXNB en Arbitrum Sepolia
const PORTAL_CONFIG = {
  // Estas son las credenciales que necesitas del Portal Dashboard
  apiKey: import.meta.env.VITE_PORTAL_API_KEY || 'YOUR_PORTAL_API_KEY', 
  
  // Auto-aprobar transacciones (puedes cambiarlo a false para mostrar confirmaciones)
  autoApprove: true,
  
  // RPC Config para Arbitrum Sepolia
  rpcConfig: {
    'eip155:421614': import.meta.env.VITE_ALCHEMY_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  },
};

// Chain ID para Arbitrum Sepolia (CAIP-2 format)
const ARBITRUM_SEPOLIA_CHAIN_ID = 'eip155:421614';

// Dirección del contrato MXNB en Arbitrum Sepolia
const MXNB_CONTRACT_ADDRESS = import.meta.env.VITE_MXNB_CONTRACT_ADDRESS || '0x...'; // Token MXNB address

class PortalService {
  private portal: Portal | null = null;
  private isInitialized = false;
  private currentUser: any = null;

  /**
   * Inicializa el Portal SDK con configuración dinámica
   */
  async initialize(configOverride?: { apiKey: string, clientId?: string }): Promise<void> {
    if (this.isInitialized && !configOverride) return;

    try {
      const config = configOverride
        ? { ...PORTAL_CONFIG, apiKey: configOverride.apiKey, clientId: configOverride.clientId }
        : PORTAL_CONFIG;
      this.portal = new Portal(config);
      this.isInitialized = true;
      console.log('✅ Portal SDK inicializado correctamente', configOverride ? '(dinámico)' : '');
    } catch (error) {
      console.error('❌ Error inicializando Portal SDK:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Crear nueva wallet MPC con configuración dinámica
   */
  async createWallet(params?: { apiKey: string, clientId?: string }): Promise<{ address: string }> {
    await this.initialize(params);
    try {
      console.log('🔄 Creando wallet MPC...');
      if (this.portal) {
        await this.portal.createWallet();
        const ethAddress = await this.portal.getEip155Address();
        this.currentUser = { address: ethAddress, provider: 'direct' };
        console.log('✅ Wallet MPC (EVM) creada exitosamente:', ethAddress);
        return { address: ethAddress };
      }
      throw new Error('Portal no inicializado');
    } catch (error) {
      console.error('❌ Error creando wallet:', error);
      throw error;
    }
  }

  /**
   * Verificar si la wallet existe
   */
  async doesWalletExist(): Promise<boolean> {
    await this.initialize();
    
    try {
      if (this.portal) {
        // Verificar si existe la wallet
        const address = await this.portal.address;
        return !!address;
      }
      return !!this.currentUser;
    } catch (error) {
      return !!this.currentUser;
    }
  }

  /**
   * Obtener dirección de la wallet
   */
  async getWalletAddress(): Promise<string | null> {
    await this.initialize();
    
    try {
      if (this.portal) {
        return this.portal.address || null;
      }
      return this.currentUser?.address || null;
    } catch (error) {
      return this.currentUser?.address || null;
    }
  }

  /**
   * Obtener balance de MXNB (real usando Portal SDK)
   */
  async getMXNBBalance(): Promise<number> {
    await this.initialize();
    try {
      if (this.portal) {
        const balances = await this.portal.getBalances(ARBITRUM_SEPOLIA_CHAIN_ID) as unknown as { rawBalance: string, decimals: number, contractAddress?: string }[];
        console.log('[DEBUG] Balances recibidos:', balances);
        const mxnb = balances.find((b) => b.contractAddress?.toLowerCase() === MXNB_CONTRACT_ADDRESS.toLowerCase());
        console.log('[DEBUG] MXNB encontrado:', mxnb);
        if (mxnb) {
          // Usar rawBalance si existe, si no usar balance
          const rawStr = mxnb.rawBalance !== undefined ? mxnb.rawBalance : mxnb['balance'];
          const raw = parseFloat(rawStr);
          // El balance ya viene en formato decimal, no dividir por 10^18
          if (!isNaN(raw)) {
            return raw;
          } else {
            console.warn('[DEBUG] rawBalance/balance no es un número válido:', rawStr);
            return 0;
          }
        }
        return 0;
      }
      return 0;
    } catch (error) {
      console.error('❌ Error obteniendo balance MXNB:', error);
      return 0;
    }
  }

  /**
   * Obtener balance de ETH (modo mock por ahora)
   */
  async getETHBalance(): Promise<number> {
    await this.initialize();
    
    try {
      // TODO: Implementar con Portal SDK
      // return await this.portal.getBalance('NATIVE');
      
      // Modo mock
      return parseFloat((Math.random() * 0.1 + 0.05).toFixed(4));
    } catch (error) {
      console.error('❌ Error obteniendo balance ETH:', error);
      return 0;
    }
  }

  /**
   * Enviar MXNB usando sendAsset (modo mock por ahora)
   */
  async sendMXNB(to: string, amount: number): Promise<string> {
    await this.initialize();
    
    try {
      if (this.portal) {
        // Usar sendAsset del Portal SDK
        const result = await this.portal.sendAsset(ARBITRUM_SEPOLIA_CHAIN_ID, {
          amount: amount.toString(),
          to: to,
          token: MXNB_CONTRACT_ADDRESS
        });
        
        // Manejo simple de la respuesta
        return typeof result === 'string' ? result : `0x${Math.random().toString(16).substr(2, 64)}`;
      }
      
      // Modo mock
      return `0x${Math.random().toString(16).substr(2, 64)}`;
    } catch (error) {
      console.error('❌ Error enviando MXNB:', error);
      throw new Error('No se pudo enviar MXNB');
    }
  }

  /**
   * Enviar ETH usando sendAsset (modo mock por ahora)
   */
  async sendETH(to: string, amount: number): Promise<string> {
    await this.initialize();
    
    try {
      if (this.portal) {
        const result = await this.portal.sendAsset(ARBITRUM_SEPOLIA_CHAIN_ID, {
          amount: amount.toString(),
          to: to,
          token: 'NATIVE'
        });
        
        return typeof result === 'string' ? result : `0x${Math.random().toString(16).substr(2, 64)}`;
      }
      
      // Modo mock
      return `0x${Math.random().toString(16).substr(2, 64)}`;
    } catch (error) {
      console.error('❌ Error enviando ETH:', error);
      throw new Error('No se pudo enviar ETH');
    }
  }

  /**
   * Financiar wallet desde faucet (modo mock por ahora)
   */
  async fundWalletFromFaucet(): Promise<string> {
    await this.initialize();
    
    try {
      if (this.portal) {
        const response = await this.portal.receiveTestnetAsset(ARBITRUM_SEPOLIA_CHAIN_ID, {
          amount: "0.01",
          token: "NATIVE"
        });
        
        return response?.data?.txHash || `0x${Math.random().toString(16).substr(2, 64)}`;
      }
      
      // Modo mock
      return `0x${Math.random().toString(16).substr(2, 64)}`;
    } catch (error) {
      console.error('❌ Error financiando desde faucet:', error);
      throw new Error('No se pudo financiar desde el faucet');
    }
  }

  /**
   * Backup de wallet (modo mock por ahora)
   */
  async backupWallet(method: 'password', options?: { password?: string }): Promise<string> {
    await this.initialize();
    
    try {
      if (this.portal && method === 'password' && options?.password) {
        // TODO: Implementar backup real cuando los tipos estén disponibles
        // const result = await this.portal.backupWallet('password', options.password);
        // return typeof result === 'string' ? result : JSON.stringify(result);
      }
      
      // Modo mock para desarrollo
      return 'mock_backup_cipher_text';
    } catch (error) {
      console.error('❌ Error haciendo backup:', error);
      throw new Error('No se pudo hacer backup de la wallet');
    }
  }

  /**
   * Recuperar wallet existente (modo mock por ahora)
   */
  async recoverWallet(method: 'password', options?: { cipherText?: string, password?: string }): Promise<{ address: string }> {
    await this.initialize();
    
    try {
      if (this.portal && method === 'password' && options?.cipherText && options?.password) {
        // TODO: Implementar recovery real cuando los tipos estén disponibles
        // const address = await this.portal.recoverWallet('password', options.cipherText, options.password);
        // this.currentUser = { address };
        // return { address };
      }
      
      // Modo mock para desarrollo
      const mockAddress = '0x742d35Cc6634C0532925a3b8D5C9c19b34c8c123';
      this.currentUser = { address: mockAddress };
      return { address: mockAddress };
    } catch (error) {
      console.error('❌ Error recuperando wallet:', error);
      throw new Error('No se pudo recuperar la wallet');
    }
  }

  /**
   * Obtener transacciones reales desde Portal SDK
   */
  async getTransactionHistory(): Promise<any[]> {
    await this.initialize();
    try {
      if (this.portal) {
        const myAddress = await this.getWalletAddress();
        const transactions = await this.portal.getTransactions(ARBITRUM_SEPOLIA_CHAIN_ID);
        if (!Array.isArray(transactions)) return [];
        console.log('[DEBUG] Transacciones crudas recibidas:', transactions);
        return transactions.map((tx: any) => {
          // Log de cada transacción para depuración
          console.log('[DEBUG] TX:', {
            hash: tx.hash,
            value: tx.value,
            tokenAddress: tx.tokenAddress,
            contractAddress: tx.contractAddress,
            symbol: tx.symbol,
            tokenSymbol: tx.tokenSymbol,
            decimals: tx.decimals
          });
          // ¿Es MXNB?
          const isMXNB = tx.tokenAddress?.toLowerCase?.() === MXNB_CONTRACT_ADDRESS.toLowerCase();
          // Símbolo y decimales
          const symbol = isMXNB ? 'MXNB' : (tx.symbol || tx.tokenSymbol || 'ETH');
          const decimals = typeof tx.decimals === 'number' ? tx.decimals : 18;
          // Calcular amount seguro
          let amount = 0;
          if (typeof tx.value === 'string' && tx.value.match(/^\d+$/)) {
            amount = parseFloat(tx.value) / Math.pow(10, decimals);
          } else if (!isNaN(Number(tx.value))) {
            amount = Number(tx.value) / Math.pow(10, decimals);
          }
          if (isNaN(amount)) amount = 0;
          // Clasificación
          const isExpense = tx.from?.toLowerCase() === myAddress?.toLowerCase();
          const isIncome = tx.to?.toLowerCase() === myAddress?.toLowerCase();
          // Fecha
          let date: Date | null = null;
          if (tx.timestamp && !isNaN(Number(tx.timestamp))) {
            date = new Date(Number(tx.timestamp) * 1000);
          }
          return {
            id: tx.hash,
            txHash: tx.hash,
            amount,
            type: isExpense ? 'expense' : isIncome ? 'income' : 'other',
            description: isExpense ? 'Envío' : isIncome ? 'Depósito' : 'Otro',
            categoryId: '',
            currency: symbol,
            date,
            from: tx.from,
            to: tx.to,
            status: (isNaN(amount) || !date) ? 'invalid' : (tx.status || 'confirmed'),
            isMXNB,
            tokenSymbol: symbol,
            tokenAddress: tx.tokenAddress || '',
            decimals,
          };
        });
      }
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo transacciones reales:', error);
      return [];
    }
  }

  /**
   * Autenticación simulada con Google (crear wallet automáticamente)
   * NOTA: Esta es una simulación. La autenticación real con Google 
   * requiere OAuth2 + Portal SDK con credenciales reales.
   */
  async loginWithGoogle(): Promise<{ address: string }> {
    try {
      console.log('🔄 Simulando login con Google...');
      
      // Simular delay de autenticación OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Crear wallet mock directamente
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      this.currentUser = { 
        address: mockAddress,
        provider: 'google'
      };
      
      console.log('✅ Login Google simulado exitoso:', mockAddress);
      return { address: mockAddress };
      
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      throw new Error('No se pudo autenticar con Google');
    }
  }

  /**
   * Autenticación simulada con Apple (crear wallet automáticamente)
   * NOTA: Esta es una simulación. La autenticación real con Apple
   * requiere Sign in with Apple + Portal SDK con credenciales reales.
   */
  async loginWithApple(): Promise<{ address: string }> {
    try {
      console.log('🔄 Simulando login con Apple...');
      
      // Simular delay de autenticación OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Crear wallet mock directamente
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      this.currentUser = { 
        address: mockAddress,
        provider: 'apple'
      };
      
      console.log('✅ Login Apple simulado exitoso:', mockAddress);
      return { address: mockAddress };
      
    } catch (error) {
      console.error('❌ Error en login con Apple:', error);
      throw new Error('No se pudo autenticar con Apple');
    }
  }

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser(): any {
    return this.currentUser;
  }

  /**
   * Establecer usuario actual (para restaurar estado)
   */
  setCurrentUser(user: any): void {
    this.currentUser = user;
  }

  /**
   * Logout (limpiar estado)
   */
  logout(): void {
    this.currentUser = null;
    console.log('Usuario deslogueado');
  }

  /**
   * Esperar a que Portal esté listo
   */
  async onReady(): Promise<void> {
    await this.initialize();
    if (this.portal && typeof this.portal.onReady === 'function') {
      return new Promise((resolve) => this.portal!.onReady(resolve));
    }
    return;
  }
}

// Singleton instance
export const portalService = new PortalService();

// Export default para compatibilidad
export default portalService;

// Tipos para TypeScript
export interface WalletInfo {
  address: string;
}

export interface Balance {
  symbol: string;
  rawBalance: string;
  decimals: number;
  contractAddress?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: string;
} 