import React, { createContext, useContext, useState, useEffect } from 'react';
// ⚠️ COMENTADO - Ahora usamos Stellar directamente
// import { portalService } from '@/services/portal';
// import { junoService } from '@/services/junoService';
// import { asignarApiKeyAUsuario } from '@/services/portalApiKeyService';
import { registrarUsuario, loginUsuario, obtenerUsuarioPorEmail } from '@/services/userService';
import { stellarService } from '@/services/stellarService';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

// Helper para encriptar/desencriptar la secret key de Stellar
// La secret key se guarda encriptada en el campo 'clabe' de Supabase
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'pumapay-stellar-secret-key-2024';

export const encryptSecretKey = (secretKey: string): string => {
  return CryptoJS.AES.encrypt(secretKey, ENCRYPTION_KEY).toString();
};

export const decryptSecretKey = (encryptedSecretKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedSecretKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

interface User {
  address: string;
  email?: string;
  name?: string;
  authMethod: 'portal' | 'traditional';
  clabe?: string;
  apiKey?: string;
  clientId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPortal: (method: 'google' | 'apple') => Promise<void>;
  logout: () => void;
  createAccount: (email: string, password: string, name: string, studentId: string, onStepChange?: (step: string) => void) => Promise<{ address: string; requiresEmailVerification?: boolean }>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createMissingAuthHandler = (method: string) => {
  return () => {
    throw new Error(`useAuth debe usarse dentro de un AuthProvider (método: ${method})`);
  };
};

const missingAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: createMissingAuthHandler('login'),
  loginWithPortal: createMissingAuthHandler('loginWithPortal'),
  logout: createMissingAuthHandler('logout'),
  createAccount: async () => {
    throw new Error('useAuth debe usarse dentro de un AuthProvider (createAccount)');
  },
  updateUser: () => {
    throw new Error('useAuth debe usarse dentro de un AuthProvider (updateUser)');
  }
};

// Clave para localStorage
const AUTH_STORAGE_KEY = 'pumapay_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Cargar usuario desde localStorage al inicializar (síncrono para no bloquear la UI)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error cargando autenticación:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setIsLoading(false);

    // Timeout de seguridad: si por cualquier razón isLoading sigue true, forzar false a los 2s
    const safety = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(safety);
  }, []);

  // Guardar usuario en localStorage
  const updateUser = (userData: User) => {
    console.log('💾 Guardando datos de autenticación:', userData);
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  // Timeout para no quedarse colgado si Supabase Auth no responde
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('Tiempo de espera agotado. Revisa tu conexión.')), ms)),
    ]);
  };

  // Login solo con tabla usuarios (Supabase DB, sin Supabase Auth)
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const safetyTimer = setTimeout(() => setIsLoading(false), 15000);
    try {
      const userData = await withTimeout(loginUsuario(email, password), 10000);
      updateUser({
        address: userData.wallet_address,
        email: userData.email,
        name: userData.nombre,
        authMethod: 'traditional',
        clabe: userData.clabe,
      });
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }
  };

  // Login con Portal (Google/Apple)
  const loginWithPortal = async (_method: 'google' | 'apple') => {
    // Portal está deshabilitado temporalmente en esta rama.
    throw new Error('El inicio de sesión con Portal no está disponible en esta versión.');
  };

  // Crear cuenta nueva con Stellar
  // onStepChange permite mostrar el progreso en el frontend
  const createAccount = async (
    email: string,
    password: string,
    name: string,
    studentId: string,
    onStepChange?: (step: string) => void
  ) => {
    setIsLoading(true);
    try {
      const nombre = name;
      const apellido = '';
      const auth_method = 'traditional';
      
      // Validar si el correo ya está registrado antes de crear la wallet Stellar
      const existingUser = await obtenerUsuarioPorEmail(email);
      if (existingUser) {
        setIsLoading(false);
        throw new Error('Este correo electrónico ya está registrado. Por favor, usa otro correo o inicia sesión.');
      }

      if (onStepChange) onStepChange('Creando wallet Stellar...');
      
      // 1. Crear cuenta Stellar
      let address: string;
      let secretKey: string;
      try {
        const account = await stellarService.createAccount();
        address = account.publicKey;
        secretKey = account.secretKey;
        console.log('✅ Wallet Stellar creada:', address);
      } catch (error: any) {
        console.error('❌ Error al crear wallet Stellar:', error);
        setIsLoading(false);
        throw new Error(`No se pudo crear la wallet Stellar: ${error.message || 'Error desconocido'}`);
      }
      
      if (onStepChange) onStepChange('Guardando usuario en Supabase...');
      
      // 2. Encriptar la secret key antes de guardarla en el campo 'clabe'
      // NOTA: Guardamos la secret key encriptada en el campo 'clabe' (antes se usaba para CLABE bancaria)
      // Esto permite recuperarla cuando el usuario necesite hacer transacciones
      const encryptedSecretKey = encryptSecretKey(secretKey);
      
      // 3. Guardar usuario en Supabase con wallet Stellar
      // La estructura es la misma que antes, solo cambia que:
      // - wallet_address es una dirección Stellar (G...)
      // - clabe contiene la secret key encriptada (en lugar de CLABE bancaria)
      // La validación de correo duplicado se hace automáticamente por Supabase si hay unique constraint
      let userInsert;
      try {
        userInsert = await registrarUsuario({
          nombre,
          apellido,
          email,
          password,
          wallet_address: address,
          clabe: encryptedSecretKey,
          auth_method,
          api_key: undefined,
          email_verified: true, // Sin Supabase Auth: cuenta lista para usar
        });
      } catch (error: any) {
        // Si es error de correo duplicado, mostrar mensaje amigable
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error('Este correo electrónico ya está registrado. Por favor, usa otro correo o inicia sesión.');
        }
        throw error;
      }
      
      const userId = userInsert && Array.isArray(userInsert) && userInsert[0]?.id;
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario después del registro');
      }
      
      console.log('✅ Usuario registrado en Supabase con ID:', userId);

      // 4. Limpiar caché local
      if (email) {
        localStorage.removeItem(`pumapay_balance_${email}`);
        localStorage.removeItem(`pumapay_transactions_${email}`);
        localStorage.removeItem(`pumapay_last_transaction_count_${email}`);
      }
      if (address) {
        localStorage.removeItem(`pumapay_balance_${address}`);
        localStorage.removeItem(`pumapay_transactions_${address}`);
        localStorage.removeItem(`pumapay_last_transaction_count_${address}`);
      }
      localStorage.removeItem('pumapay_mxnb_balance');
      localStorage.removeItem('pumapay_transactions');

      // 5. Auto-login inmediato para que el usuario quede logueado antes de navegar
      try {
        const userData = await loginUsuario(email, password);
        updateUser({
          address: userData.wallet_address,
          email: userData.email,
          name: userData.nombre,
          authMethod: 'traditional',
          clabe: userData.clabe,
        });
      } catch (loginErr) {
        console.warn('Auto-login tras registro:', loginErr);
        // No lanzar: la cuenta ya está creada; el usuario puede iniciar sesión manualmente
      }

      setIsLoading(false);
      console.log('✅ Registro completado');
      return { address };
    } catch (error: any) {
      setIsLoading(false);
      // Si es error de correo duplicado, mostrar mensaje amigable
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        throw new Error('Este correo electrónico ya está registrado. Por favor, usa otro correo o inicia sesión.');
      }
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    if (user?.email) {
      localStorage.removeItem(`pumapay_balance_${user.email}`);
      localStorage.removeItem(`pumapay_transactions_${user.email}`);
      localStorage.removeItem(`pumapay_last_transaction_count_${user.email}`);
    }
    if (user?.address) {
      localStorage.removeItem(`pumapay_balance_${user.address}`);
      localStorage.removeItem(`pumapay_transactions_${user.address}`);
      localStorage.removeItem(`pumapay_last_transaction_count_${user.address}`);
    }
    localStorage.removeItem('pumapay_mxnb_balance');
    localStorage.removeItem('pumapay_transactions');
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      loginWithPortal,
      logout,
      createAccount,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (import.meta.env.DEV) {
      console.warn('useAuth se llamó fuera de AuthProvider. Usando contexto vacío.');
    }
    return missingAuthContext;
  }
  return context;
}; 

// NOTA: Durante el signup, el usuario solo verá el spinner. Todo el proceso de registro, asignación de API Key, creación de wallet y CLABE ocurre en background antes de navegar a /home o mostrar el éxito. 