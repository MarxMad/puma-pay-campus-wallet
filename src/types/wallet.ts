
export interface WalletBalance {
  mxnb: string;
  fiat: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'deposit' | 'withdrawal' | 'received';
  amount: string;
  currency: 'MXNB' | 'MXN';
  merchant?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  hash?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  wallet_address?: string;
  university?: string;
  student_id?: string;
}

export interface PaymentRequest {
  merchant: string;
  amount: string;
  concept: string;
  qr_code?: string;
}
