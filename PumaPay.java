/**
 * PumaPay Campus Wallet - Main Application
 * 
 * Sistema de wallet digital universitaria para la UNAM
 * Permite pagos con tokens MXNB en el campus
 * 
 * @author PumaPay Team
 * @version 1.0.0
 */
public class PumaPay {
    
    /**
     * Método principal de la aplicación PumaPay
     * 
     * @param args Argumentos de línea de comandos
     */
    public static void main(String[] args) {
        System.out.println("PumaPay Campus Wallet");
        System.out.println("Sistema de wallet digital universitaria");
        System.out.println("Integración con MXNB y Blockchain");
    }
    
    /**
     * Clase para manejar transacciones MXNB
     */
    public static class MXNBTransaction {
        private String walletAddress;
        private double amount;
        private String transactionHash;
        
        public MXNBTransaction(String walletAddress, double amount) {
            this.walletAddress = walletAddress;
            this.amount = amount;
        }
        
        // Getters y Setters
        public String getWalletAddress() {
            return walletAddress;
        }
        
        public double getAmount() {
            return amount;
        }
        
        public String getTransactionHash() {
            return transactionHash;
        }
        
        public void setTransactionHash(String transactionHash) {
            this.transactionHash = transactionHash;
        }
    }
}

