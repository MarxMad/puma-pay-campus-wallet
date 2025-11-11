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
   * Crear nueva wallet MPC con configuración dinámica y patrón onReady
   */
  async createWallet(params?: { apiKey: string, clientId?: string }): Promise<{ address: string }> {
    await this.initialize(params);
    return new Promise((resolve, reject) => {
      if (!this.portal) return reject(new Error('Portal no inicializado'));
      this.portal.onReady(async () => {
        try {
          const exists = await this.portal!.doesWalletExist();
          if (!exists) {
            await this.portal!.createWallet();
          }
          const ethAddress = await this.portal!.getEip155Address();
          this.currentUser = { address: ethAddress, provider: 'direct' };
          console.log('✅ Wallet MPC (EVM) creada exitosamente:', ethAddress);
          resolve({ address: ethAddress });
        } catch (error) {
          console.error('❌ Error creando wallet:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Verificar si la wallet existe (mejorado para Account Abstraction)
   */
  async doesWalletExist(): Promise<boolean> {
    await this.initialize();
    
    try {
      if (!this.portal) {
        return !!this.currentUser?.address;
      }

      // Método 1: Verificar portal.address directamente
      if (this.portal.address) {
        console.log('✅ Wallet existe en Portal (portal.address):', this.portal.address);
        return true;
      }

      // Método 2: Intentar obtener la dirección con getEip155Address (puede tomar tiempo con AA)
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          // Si no responde en 5 segundos, verificar dirección guardada
          if (this.currentUser?.address) {
            console.log('✅ Usando dirección guardada (timeout):', this.currentUser.address);
            resolve(true);
          } else {
            console.warn('⚠️ No se pudo verificar la wallet (timeout)');
            resolve(false);
          }
        }, 5000);

        this.portal!.onReady(async () => {
          try {
            const address = await this.portal!.getEip155Address();
            if (address) {
              console.log('✅ Wallet existe en Portal (getEip155Address):', address);
              clearTimeout(timeout);
              resolve(true);
              return;
            }
          } catch (error: any) {
            // Con Account Abstraction, puede que la wallet no esté desplegada aún
            // pero eso no significa que no exista
            if (error?.message?.includes('wallet does not exist')) {
              console.warn('⚠️ Portal retornó error: wallet does not exist.');
              console.warn('⚠️ La wallet no existe en Portal - esto es normal si la wallet fue creada recientemente');
            } else {
              console.warn('⚠️ Error obteniendo dirección de Portal:', error);
            }
          }

          clearTimeout(timeout);
          
          // Si Portal no responde, verificar si tenemos dirección guardada
          if (this.currentUser?.address) {
            console.log('✅ Usando dirección guardada:', this.currentUser.address);
            resolve(true);
          } else {
            console.warn('⚠️ No se pudo verificar la wallet');
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.warn('⚠️ Error en doesWalletExist:', error);
      // Si hay error pero tenemos dirección guardada, asumimos que existe
      return !!this.currentUser?.address;
    }
  }

  /**
   * Obtener dirección de la wallet (múltiples métodos para Account Abstraction)
   */
  async getWalletAddress(): Promise<string | null> {
    await this.initialize();
    
    try {
      if (!this.portal) {
        return this.currentUser?.address || null;
      }

      // Método 1: Intentar obtener desde portal.address (puede estar disponible inmediatamente)
      if (this.portal.address) {
        console.log('✅ Dirección obtenida de portal.address:', this.portal.address);
        return this.portal.address;
      }

      // Método 2: Intentar con getEip155Address dentro de onReady
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          // Si no responde en 3 segundos, usar dirección guardada
          console.warn('⚠️ Timeout obteniendo dirección, usando dirección guardada');
          resolve(this.currentUser?.address || null);
        }, 3000);

        this.portal!.onReady(async () => {
          try {
            const address = await this.portal!.getEip155Address();
            if (address) {
              console.log('✅ Dirección obtenida de getEip155Address:', address);
              clearTimeout(timeout);
              resolve(address);
              return;
            }
          } catch (error) {
            console.warn('⚠️ Error en getEip155Address:', error);
          }
          
          clearTimeout(timeout);
          resolve(this.currentUser?.address || null);
        });
      });
    } catch (error) {
      console.warn('⚠️ Error en getWalletAddress:', error);
      return this.currentUser?.address || null;
    }
  }

  /**
   * Obtener balance de MXNB (REAL usando Portal SDK)
   */
  async getMXNBBalance(): Promise<number> {
    await this.initialize();
    try {
      if (!this.portal) {
        console.warn('⚠️ Portal no inicializado, retornando balance 0');
        return 0;
      }

      console.log('🔄 Obteniendo balance MXNB real desde Portal...');
      
      // Verificar que tenemos la dirección del contrato MXNB
      if (!MXNB_CONTRACT_ADDRESS || MXNB_CONTRACT_ADDRESS === '0x...') {
        console.warn('⚠️ Dirección del contrato MXNB no configurada');
        return 0;
      }

      let balances: any;
      try {
        balances = await this.portal.getBalances(ARBITRUM_SEPOLIA_CHAIN_ID);
      } catch (error: any) {
        console.warn('⚠️ Error obteniendo balances de Portal:', error);
        return 0;
      }
      
      console.log('📊 Balances recibidos desde Portal:', balances);
      
      // Verificar si es null, undefined, o un error
      if (!balances) {
        console.warn('⚠️ Portal retornó null o undefined');
        return 0;
      }
      
      // Verificar si es un objeto de error
      if (typeof balances === 'object' && !Array.isArray(balances)) {
        if ('error' in balances) {
          console.warn('⚠️ Portal retornó error:', balances.error);
          if (balances.error?.includes('wallet does not exist')) {
            console.warn('⚠️ La wallet no existe en Portal - esto es normal si la wallet fue creada recientemente');
          }
          return 0;
        }
        // Si es un objeto pero no tiene 'error', podría ser un formato inesperado
        console.warn('⚠️ Respuesta de balances no es un array ni un error reconocido:', balances);
        return 0;
      }
      
      // Verificar que es un array antes de usar .find()
      if (!Array.isArray(balances)) {
        console.warn('⚠️ Respuesta de balances no es un array:', typeof balances, balances);
        return 0;
      }
      
      const mxnb = balances.find((b: any) => 
        b.contractAddress?.toLowerCase() === MXNB_CONTRACT_ADDRESS.toLowerCase() ||
        b.symbol?.toLowerCase() === 'mxnb'
      );
      
      console.log('💰 MXNB encontrado:', mxnb);
      
      if (mxnb) {
        // Usar rawBalance si existe, si no usar balance
        const rawStr = mxnb.rawBalance !== undefined ? mxnb.rawBalance : mxnb['balance'];
        const raw = parseFloat(rawStr);
        
        // El balance ya viene en formato decimal, no dividir por 10^18
        if (!isNaN(raw)) {
          console.log('✅ Balance MXNB obtenido:', raw);
          return raw;
        } else {
          console.warn('⚠️ rawBalance/balance no es un número válido:', rawStr);
          return 0;
        }
      }
      
      console.log('ℹ️ No se encontró balance MXNB, retornando 0');
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
   * Enviar MXNB usando sendAsset (TRANSACCIONES REALES)
   * @param to - Dirección destino
   * @param amount - Cantidad a enviar
   * @param fromAddress - Dirección del usuario (opcional, se obtiene automáticamente si no se proporciona)
   * @param credentials - Credenciales de Portal (opcional, se usan si están disponibles)
   */
  async sendMXNB(to: string, amount: number, fromAddress?: string, credentials?: { apiKey?: string, clientId?: string }): Promise<string> {
    // Si se proporcionan credenciales, re-inicializar Portal con ellas
    if (credentials?.apiKey) {
      console.log('🔄 Re-inicializando Portal con credenciales proporcionadas...');
      await this.initialize({
        apiKey: credentials.apiKey,
        clientId: credentials.clientId
      });
    } else {
      await this.initialize();
    }
    
    try {
      if (!this.portal) {
        throw new Error('Portal no inicializado');
      }

      console.log('🚀 Enviando MXNB real:', { to, amount, contract: MXNB_CONTRACT_ADDRESS });
      
      // Verificar que tenemos la dirección del contrato MXNB
      if (!MXNB_CONTRACT_ADDRESS || MXNB_CONTRACT_ADDRESS === '0x...') {
        throw new Error('Dirección del contrato MXNB no configurada');
      }

      // Según la documentación de Portal, NO necesitamos obtener la dirección antes de enviar.
      // Portal SDK maneja todo internamente, incluso con Account Abstraction.
      // La wallet de smart contract se desplegará automáticamente en la primera transacción.
      return new Promise((resolve, reject) => {
        // Timeout de seguridad
        const timeout = setTimeout(() => {
          reject(new Error('Timeout esperando a que Portal esté listo. Intenta nuevamente.'));
        }, 15000); // 15 segundos máximo (Account Abstraction puede tomar más tiempo)

        this.portal!.onReady(async () => {
          try {
            clearTimeout(timeout);
            
            // Sincronizar dirección si se proporciona (para logging, no requerida para la transacción)
            if (fromAddress) {
              if (!this.currentUser) this.currentUser = {};
              this.currentUser.address = fromAddress;
              console.log('✅ Dirección sincronizada:', fromAddress);
            }
            
            console.log('✅ Portal listo. Enviando transacción con sendAsset...');
            console.log('ℹ️ Con Account Abstraction, la wallet se desplegará automáticamente si es la primera transacción.');

            // Usar sendAsset del Portal SDK directamente - Portal maneja todo internamente
            // No necesitamos obtener la dirección antes, Portal lo hace automáticamente
            const result = await this.portal!.sendAsset(ARBITRUM_SEPOLIA_CHAIN_ID, {
              amount: amount.toString(),
              to: to,
              token: MXNB_CONTRACT_ADDRESS
            });
            
            console.log('✅ Transacción MXNB enviada:', result);
            
            // Con Account Abstraction, el hash es un User Operation hash, no un transaction hash
            const resultAny = result as any;
            const txHash = typeof result === 'string' 
              ? result 
              : resultAny?.txHash || resultAny?.hash || resultAny?.transactionHash || resultAny?.userOpHash || 'unknown';
            
            console.log('✅ Hash de transacción/User Operation:', txHash);
            console.log('ℹ️ Si es Account Abstraction, este es un User Operation hash. Puedes verlo en Jiffy Scan.');
            
            resolve(txHash);
          } catch (error: any) {
            console.error('❌ Error enviando MXNB:', error);
            reject(new Error(`No se pudo enviar MXNB: ${error.message || error}`));
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Error enviando MXNB:', error);
      throw new Error(`No se pudo enviar MXNB: ${error.message || error}`);
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
   * Backup de wallet usando método password
   */
  async backupWallet(password: string) {
    await this.initialize();
    if (!this.portal) throw new Error('Portal no inicializado');
    try {
      const result = await this.portal.backupWallet('password' as any, { password } as any);
      console.log('✅ Backup de wallet realizado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error haciendo backup de wallet:', error);
      throw error;
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

  /**
   * Enviar tokens usando Account Abstraction (sendAsset)
   */
  async sendAsset(chainId: string, params: { amount: string, to: string, token: string }) {
    await this.initialize();
    if (!this.portal) throw new Error('Portal no inicializado');
    return this.portal.sendAsset(chainId, params);
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