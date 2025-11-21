/**
 * Servicio para envíos y depósitos usando Stellar/Soroban
 * Reemplaza la implementación anterior de Arbitrum
 */

// Importación dinámica para evitar errores si el SDK no está disponible
let StellarSDK: any = null;
const loadStellarSDK = async () => {
  if (StellarSDK) {
    return StellarSDK;
  }
  const sdkModule = await import('@stellar/stellar-sdk');
  StellarSDK = sdkModule?.default ? sdkModule.default : sdkModule;
  return StellarSDK;
};

// Helper para desencriptar la secret key desde el campo 'clabe' de Supabase
// La secret key se guarda encriptada en el campo 'clabe' de Supabase
export const decryptSecretKey = (encryptedSecretKey: string): string => {
  const CryptoJS = require('crypto-js');
  const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'pumapay-stellar-secret-key-2024';
  const bytes = CryptoJS.AES.decrypt(encryptedSecretKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Configuración de Stellar
const STELLAR_NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet'; // 'testnet' o 'mainnet'
const STELLAR_HORIZON_URL = STELLAR_NETWORK === 'mainnet'
  ? 'https://horizon.stellar.org'
  : 'https://horizon-testnet.stellar.org';

// Asset USDC (Stellar Asset)
// En producción, esto sería USDC o un asset emitido por Bitso/PumaPay
const USDC_ASSET_CODE = 'USDC';
const USDC_ISSUER = import.meta.env.VITE_USDC_ISSUER || 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'; // USDC issuer en Stellar

class StellarService {
  private server: any = null;
  private networkPassphrase: string;
  private isInitialized: boolean = false;

  private async fetchAccountFromHorizon(address: string) {
    if (!this.isValidStellarAddress(address)) {
      throw new Error('Dirección Stellar inválida');
    }
    const url = `${STELLAR_HORIZON_URL}/accounts/${address}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Horizon respondió ${response.status}: ${text}`);
    }
    return response.json();
  }

  constructor() {
    this.networkPassphrase = STELLAR_NETWORK === 'mainnet'
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015';
    this.initializeSDK();
  }

  private async initializeSDK() {
    try {
      const sdk = await loadStellarSDK();
      
      if (sdk && sdk.Server) {
        this.server = new sdk.Server(STELLAR_HORIZON_URL);
        this.isInitialized = true;
        // Log solo en desarrollo
        if (import.meta.env.DEV) {
          console.log('✅ Stellar SDK inicializado correctamente');
        }
      } else {
        // Solo mostrar warning en desarrollo
        if (import.meta.env.DEV) {
          console.warn('⚠️ Stellar SDK no disponible. Funcionalidad limitada.');
        }
      }
    } catch (error: any) {
      // Solo mostrar errores en desarrollo
      if (import.meta.env.DEV) {
        console.error('❌ Error inicializando Stellar SDK:', error);
        if (error.message?.includes('Failed to fetch') || error.message?.includes('Cannot find module')) {
          console.warn('⚠️ Stellar SDK no está instalado. Ejecuta: npm install @stellar/stellar-sdk');
        } else {
          console.warn('⚠️ Stellar SDK no disponible. Funcionalidad limitada.');
        }
      }
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeSDK();
    }
    if (!this.server) {
      throw new Error('Stellar SDK no está disponible. Por favor, instala @stellar/stellar-sdk');
    }
  }

  /**
   * Envía USDC a una dirección Stellar
   * @param destinationAddress - Dirección Stellar del destinatario (G...)
   * @param amount - Cantidad a enviar
   * @param sourceSecretKey - Secret key del remitente (opcional, se obtiene del usuario)
   * @returns Hash de la transacción
   */
  async sendUSDC(
    destinationAddress: string,
    amount: number,
    sourceSecretKey?: string
  ): Promise<string> {
    try {
      await this.ensureInitialized();

      // Validar dirección Stellar
      if (!this.isValidStellarAddress(destinationAddress)) {
        throw new Error('Dirección Stellar inválida. Debe comenzar con "G"');
      }

      // Obtener keypair del remitente
      // En producción, esto se obtendría del usuario autenticado
      if (!sourceSecretKey) {
        throw new Error('Secret key del remitente requerida');
      }

      const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecretKey);
      const sourcePublicKey = sourceKeypair.publicKey();

      // Cargar cuenta del remitente
      const sourceAccount = await this.server.loadAccount(sourcePublicKey);

      // Crear asset USDC
      const usdcAsset = new StellarSDK.Asset(USDC_ASSET_CODE, USDC_ISSUER);

      // Construir transacción
      const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
        fee: '100', // Fee base en stroops
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSDK.Operation.payment({
            destination: destinationAddress,
            asset: usdcAsset,
            amount: amount.toFixed(7), // Stellar usa 7 decimales
          })
        )
        .setTimeout(30)
        .build();

      // Firmar transacción
      transaction.sign(sourceKeypair);

      // Enviar transacción
      const result = await this.server.submitTransaction(transaction);

      console.log('✅ Transacción Stellar enviada:', result.hash);
      return result.hash;
    } catch (error: any) {
      console.error('❌ Error enviando USDC en Stellar:', error);
      throw new Error(`Error enviando USDC: ${error.message}`);
    }
  }

  /**
   * Obtiene los balances disponibles en la cuenta (USDC y XLM nativo)
   */
  async getBalances(address: string): Promise<{ usdc: number; native: number }> {
    try {
      let accountData: any;
      try {
        await this.ensureInitialized();
        accountData = await this.server.loadAccount(address);
      } catch (sdkError) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ No se pudo usar Stellar SDK, consultando Horizon directamente...', sdkError);
        }
        accountData = await this.fetchAccountFromHorizon(address);
      }

      const balances = accountData?.balances || [];
      let usdcBalance = 0;
      let nativeBalance = 0;

      for (const balance of balances) {
        if (
          balance.asset_code === USDC_ASSET_CODE &&
          balance.asset_issuer === USDC_ISSUER
        ) {
          usdcBalance = parseFloat(balance.balance);
        } else if (balance.asset_type === 'native') {
          nativeBalance = parseFloat(balance.balance);
        }
      }

      return { usdc: usdcBalance, native: nativeBalance };
    } catch (error: any) {
      console.error('❌ Error obteniendo balances Stellar:', error);
      return { usdc: 0, native: 0 };
    }
  }

  /**
   * Obtiene el balance principal de la cuenta.
   * Prioriza USDC; si no existe, regresa XLM nativo.
   */
  async getBalance(address: string): Promise<number> {
    const { usdc, native } = await this.getBalances(address);
    return usdc > 0 ? usdc : native;
  }

  /**
   * Crea una cuenta Stellar nueva
   * @returns { publicKey, secretKey }
   * 
   * NOTA: No requiere que el SDK esté completamente inicializado,
   * solo necesita Keypair que está disponible inmediatamente
   */
  async createAccount(): Promise<{ publicKey: string; secretKey: string }> {
    try {
      // Intentar cargar el SDK si no está disponible
      if (!StellarSDK) {
        try {
          await loadStellarSDK();
        } catch (importError) {
          console.error('❌ Error importando Stellar SDK:', importError);
          throw new Error('Stellar SDK no está disponible. Por favor, ejecuta: npm install @stellar/stellar-sdk');
        }
      }
      
      // Verificar que Keypair esté disponible
      if (!StellarSDK || !StellarSDK.Keypair) {
        throw new Error('Stellar SDK no está correctamente cargado. Keypair no disponible.');
      }
      
      // Crear keypair (no requiere conexión al servidor)
      const keypair = StellarSDK.Keypair.random();
      
      const account = {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      };
      
      console.log('✅ Cuenta Stellar creada:', account.publicKey);
      return account;
    } catch (error: any) {
      console.error('❌ Error creando cuenta Stellar:', error);
      throw new Error(`Error creando cuenta Stellar: ${error.message}`);
    }
  }

  /**
   * Valida una dirección Stellar
   */
  isValidStellarAddress(address: string): boolean {
    try {
      if (!StellarSDK) {
        // Validación básica sin SDK
        return address.startsWith('G') && address.length === 56;
      }
      StellarSDK.Keypair.fromPublicKey(address);
      return address.startsWith('G');
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el historial de transacciones de una cuenta
   */
  async getTransactions(address: string, limit: number = 10): Promise<any[]> {
    try {
      await this.ensureInitialized();
      const account = await this.server.loadAccount(address);
      const transactions = await this.server
        .transactions()
        .forAccount(address)
        .limit(limit)
        .order('desc')
        .call();

      return transactions.records.map((tx: any) => ({
        id: tx.id,
        hash: tx.hash,
        createdAt: tx.created_at,
        sourceAccount: tx.source_account,
        operations: tx.operations,
      }));
    } catch (error: any) {
      console.error('❌ Error obteniendo transacciones:', error);
      return [];
    }
  }

  /**
   * Obtiene información de la red
   */
  getNetworkInfo() {
    return {
      network: STELLAR_NETWORK,
      horizonUrl: STELLAR_HORIZON_URL,
      passphrase: this.networkPassphrase,
      assetCode: USDC_ASSET_CODE,
      assetIssuer: USDC_ISSUER,
    };
  }

  /**
   * Fondea una cuenta en testnet usando Friendbot
   * @param publicKey - Clave pública de la cuenta Stellar
   * @returns Resultado del fondeo
   */
  async fundWithFriendbot(publicKey: string): Promise<{ success: boolean; message: string }> {
    try {
      if (STELLAR_NETWORK !== 'testnet') {
        throw new Error('Friendbot solo está disponible en testnet');
      }

      if (!this.isValidStellarAddress(publicKey)) {
        throw new Error('Dirección Stellar inválida');
      }

      const friendbotUrl = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
      
      console.log('🔄 Fondeando cuenta con Friendbot...', publicKey);
      
      const response = await fetch(friendbotUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al fondear cuenta: ${errorText}`);
      }

      const data = await response.json();
      
      console.log('✅ Cuenta fondeada exitosamente con 10,000 XLM');
      
      return {
        success: true,
        message: 'Cuenta fondeada exitosamente con 10,000 XLM en testnet'
      };
    } catch (error: any) {
      console.error('❌ Error fondeando cuenta con Friendbot:', error);
      throw new Error(`Error fondeando cuenta: ${error.message}`);
    }
  }
}

// Crear instancia del servicio (lazy initialization)
export const stellarService = new StellarService();

// Alias para compatibilidad con código anterior
export const sendMXNB = (destinationAddress: string, amount: number, sourceSecretKey?: string) => {
  return stellarService.sendUSDC(destinationAddress, amount, sourceSecretKey);
};

