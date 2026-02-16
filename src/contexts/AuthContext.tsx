import React, { createContext, useContext, useState, useEffect } from 'react';
// ⚠️ COMENTADO - Ahora usamos Stellar directamente
// import { portalService } from '@/services/portal';
// import { junoService } from '@/services/junoService';
// import { asignarApiKeyAUsuario } from '@/services/portalApiKeyService';
import { registrarUsuario, loginUsuario, obtenerUsuarioPorEmail, getUsuarioByEmailFull, updateEmailVerified } from '@/services/userService';
import { supabase } from '@/services/supabaseClient';
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

  // Cargar usuario desde localStorage al inicializar
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error cargando autenticación:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Sincronizar email_verified cuando el usuario confirma el correo (Supabase Auth)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        try {
          await updateEmailVerified(session.user.email);
        } catch (e) {
          console.warn('No se pudo actualizar email_verified:', e);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Guardar usuario en localStorage
  const updateUser = (userData: User) => {
    console.log('💾 Guardando datos de autenticación:', userData);
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  // Login tradicional: primero Supabase Auth (verificación de correo), si falla intentar tabla usuarios (legacy)
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (!authError && authData.user) {
        // Supabase Auth OK: cargar perfil desde tabla usuarios
        const usuario = await getUsuarioByEmailFull(authData.user.email!);
        if (!usuario) {
          await supabase.auth.signOut();
          throw new Error('No se encontró tu perfil. Contacta soporte.');
        }
        await updateEmailVerified(authData.user.email!);
        updateUser({
          address: usuario.wallet_address,
          email: usuario.email,
          name: usuario.nombre,
          authMethod: 'traditional',
          clabe: usuario.clabe,
        });
        return;
      }

      // Si el error es "email not confirmed", no intentar login legacy
      const msg = authError?.message?.toLowerCase() ?? '';
      if (msg.includes('confirm') || msg.includes('verified') || authError?.status === 403) {
        throw new Error('EMAIL_NOT_CONFIRMED');
      }

      // Fallback: usuarios sin Supabase Auth (legacy)
      const userData = await loginUsuario(email, password);
      await updateEmailVerified(email);
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
      
      if (onStepChange) onStepChange('Verificando correo...');

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
          email_verified: false, // Se marcará true cuando confirme el correo vía Supabase
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

      if (onStepChange) onStepChange('Enviando correo de verificación...');

      // 4. Registrar en Supabase Auth para enviar correo de verificación
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nombre },
          emailRedirectTo: `${baseUrl}/login?verified=1`,
        },
      });
      if (signUpError && signUpError.message?.toLowerCase().includes('already registered')) {
        // Usuario ya existía en Auth (ej. reintento); seguimos y pedimos que verifique
      } else if (signUpError) {
        console.warn('Supabase signUp (correo verificación):', signUpError);
        // No bloqueamos: el usuario ya está en nuestra tabla; puede usar login legacy
      }

      // 5. Limpiar caché local
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

      setIsLoading(false);
      console.log('✅ Registro completado; correo de verificación enviado');
      // No hacer login: el usuario debe confirmar el correo y luego iniciar sesión
      return { address, requiresEmailVerification: true };
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
    await supabase.auth.signOut();
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