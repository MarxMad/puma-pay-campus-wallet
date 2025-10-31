// Servicio para obtener balance de MXNB usando ethers.js directamente desde el contrato ERC20
// Esto nos permite obtener el balance real desde la blockchain sin depender de APIs externas

import { ethers } from 'ethers';
import { config } from '@/config/env';

// ABI mínimo para un contrato ERC20 (solo las funciones que necesitamos)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

/**
 * Clase para obtener balance MXNB usando ethers.js
 */
class EthersBalanceService {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;

  /**
   * Inicializa el provider y el contrato
   */
  private initialize(): void {
    // Obtener configuración
    const rpcUrl = config.portal.alchemyRpcUrl || 'https://sepolia-rollup.arbitrum.io/rpc';
    const contractAddress = config.portal.mxnbContractAddress;

    // Validar que tenemos la dirección del contrato
    if (!contractAddress || contractAddress === '0x...') {
      throw new Error('Dirección del contrato MXNB no configurada (VITE_MXNB_CONTRACT_ADDRESS)');
    }

    // Crear provider si no existe
    if (!this.provider) {
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      console.log('✅ Provider ethers.js inicializado:', rpcUrl);
    }

    // Crear instancia del contrato si no existe
    if (!this.contract) {
      this.contract = new ethers.Contract(
        contractAddress,
        ERC20_ABI,
        this.provider
      );
      console.log('✅ Contrato MXNB inicializado:', contractAddress);
    }
  }

  /**
   * Obtener balance de MXNB para una dirección específica
   * @param walletAddress - Dirección de la wallet
   * @returns Balance en formato decimal (ej: 100.50 MXNB)
   */
  async getMXNBBalance(walletAddress: string): Promise<number> {
    try {
      this.initialize();

      if (!this.contract || !this.provider) {
        throw new Error('No se pudo inicializar el provider o el contrato');
      }

      // Validar dirección
      if (!ethers.utils.isAddress(walletAddress)) {
        throw new Error(`Dirección de wallet inválida: ${walletAddress}`);
      }

      console.log('🔄 Consultando balance MXNB desde blockchain:', {
        wallet: walletAddress,
        contract: this.contract.address,
        network: 'Arbitrum Sepolia'
      });

      // Obtener decimals del contrato
      const decimals = await this.contract.decimals();
      console.log('📊 Decimals del contrato:', decimals);

      // Obtener balance en formato raw (BigNumber)
      const rawBalance = await this.contract.balanceOf(walletAddress);
      console.log('📈 Balance raw (BigNumber):', rawBalance.toString());

      // Convertir de wei a formato decimal
      // Dividir por 10^decimals
      const balanceFormatted = parseFloat(
        ethers.utils.formatUnits(rawBalance, decimals)
      );

      console.log('✅ Balance MXNB obtenido desde blockchain:', balanceFormatted);

      return balanceFormatted;
    } catch (error: any) {
      console.error('❌ Error obteniendo balance MXNB con ethers.js:', error);
      
      // Si el error es por configuración faltante, lo propagamos
      if (error.message?.includes('no configurada')) {
        throw error;
      }
      
      // Para otros errores, retornamos 0
      return 0;
    }
  }

  /**
   * Obtener información del token (símbolo y decimals)
   */
  async getTokenInfo(): Promise<{ symbol: string; decimals: number } | null> {
    try {
      this.initialize();

      if (!this.contract) {
        return null;
      }

      const [symbol, decimals] = await Promise.all([
        this.contract.symbol(),
        this.contract.decimals()
      ]);

      return { symbol, decimals };
    } catch (error) {
      console.error('❌ Error obteniendo información del token:', error);
      return null;
    }
  }

  /**
   * Verificar si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    const contractAddress = config.portal.mxnbContractAddress;
    const rpcUrl = config.portal.alchemyRpcUrl;
    
    return !!(
      contractAddress &&
      contractAddress !== '0x...' &&
      rpcUrl
    );
  }
}

// Exportar instancia singleton
export const ethersBalanceService = new EthersBalanceService();

