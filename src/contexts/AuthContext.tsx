import React, { createContext, useContext, useState, useEffect } from 'react';
// ⚠️ COMENTADO - Ahora usamos Stellar directamente
// import { portalService } from '@/services/portal';
// import { junoService } from '@/services/junoService';
// import { asignarApiKeyAUsuario } from '@/services/portalApiKeyService';
import { registrarUsuario, loginUsuario, obtenerUsuarioPorEmail } from '@/services/userService';
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
  createAccount: (email: string, password: string, name: string, studentId: string) => Promise<{ address: string }>;
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
          
          // ⚠️ COMENTADO - Ya no usamos Portal, ahora usamos Stellar directamente
          /*
          // Si es usuario de Portal, re-inicializar Portal con las credenciales correctas
          if (userData.authMethod === 'portal' || userData.authMethod === 'traditional') {
            // Restaurar estado en el servicio Portal
            portalService.setCurrentUser({ address: userData.address });
            
            // Si tenemos credenciales, re-inicializar Portal con ellas
            if (userData.apiKey) {
              console.log('🔄 Re-inicializando Portal con credenciales del usuario...');
              try {
                await portalService.initialize({
                  apiKey: userData.apiKey,
                  clientId: userData.clientId
                });
                console.log('✅ Portal re-inicializado correctamente');
              } catch (error) {
                console.warn('⚠️ Error re-inicializando Portal:', error);
              }
            }
          }
          */
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

  // Guardar usuario en localStorage
  const updateUser = (userData: User) => {
    console.log('💾 Guardando datos de autenticación:', userData);
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  // Login tradicional con email/password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Autenticar contra Supabase
      const userData = await loginUsuario(email, password);
      
      // ⚠️ COMENTADO - Ya no usamos Portal Client Session Token
      // Ahora usamos Stellar directamente, no necesitamos tokens de Portal
      /*
      // Obtener o refrescar Client Session Token
      let clientSessionToken: string | undefined;
      let portalClientId: string | undefined;
      
      // Si el usuario tiene portal_client_id, intentar refrescar el token
      if (userData.portal_client_id) {
        try {
          console.log('🔄 Refrescando Client Session Token...');
          const refreshed = await refreshPortalSession(userData.portal_client_id);
          clientSessionToken = refreshed.clientSessionToken;
          portalClientId = userData.portal_client_id;
          console.log('✅ Client Session Token refrescado');
        } catch (error) {
          console.warn('⚠️ No se pudo refrescar Client Session Token, intentando crear nuevo cliente...', error);
          // Si falla, crear un nuevo cliente
          try {
            const newClient = await createPortalClient();
            clientSessionToken = newClient.clientSessionToken;
            portalClientId = newClient.clientId;
            console.log('✅ Nuevo cliente creado en Portal');
          } catch (createError) {
            console.error('❌ Error creando nuevo cliente:', createError);
            // Continuar sin Client Session Token (modo demo)
          }
        }
      } else if (userData.client_session_token) {
        // Si tiene client_session_token guardado, intentar usarlo primero
        // Si falla, se refrescará o se creará uno nuevo
        clientSessionToken = userData.client_session_token;
        portalClientId = userData.portal_client_id;
        console.log('ℹ️ Usando Client Session Token guardado (puede estar expirado)');
        console.log('🔑 Token guardado:', {
          hasToken: !!clientSessionToken,
          tokenPrefix: clientSessionToken?.substring(0, 20) + '...',
          tokenLength: clientSessionToken?.length,
          hasClientId: !!portalClientId,
          clientId: portalClientId
        });
      } else {
        // Si no tiene token, crear uno nuevo
        console.log('⚠️ Usuario no tiene Client Session Token, creando uno nuevo...');
        try {
          const newClient = await createPortalClient();
          clientSessionToken = newClient.clientSessionToken;
          portalClientId = newClient.clientId;
          console.log('✅ Nuevo Client Session Token creado');
          
          // Guardar el nuevo token en la base de datos
          try {
            await supabase
              .from('usuarios')
              .update({
                client_session_token: clientSessionToken,
                portal_client_id: portalClientId
              })
              .eq('id', userData.id);
            console.log('✅ Client Session Token guardado en la base de datos');
          } catch (updateError) {
            console.warn('⚠️ No se pudo guardar el Client Session Token en la base de datos:', updateError);
          }
        } catch (createError) {
          console.error('❌ Error creando nuevo Client Session Token:', createError);
          // Continuar sin token (fallará al enviar transacciones)
        }
      }
      */
      
      // ⚠️ COMENTADO - Ya no usamos Portal
      /*
      // Re-inicializar Portal con Client Session Token si está disponible
      if (clientSessionToken) {
        console.log('🔄 Re-inicializando Portal con Client Session Token...');
        await portalService.initialize({
          apiKey: clientSessionToken, // Client Session Token, NO Portal API Key
          clientId: portalClientId
        });
        console.log('✅ Portal re-inicializado correctamente');
      } else {
        console.warn('⚠️ No se pudo obtener Client Session Token, Portal puede no funcionar correctamente');
      }
      
      // Sincronizar usuario con Portal Service
      portalService.setCurrentUser({ address: userData.wallet_address });
      */
      
      // Guardar usuario autenticado en localStorage
      updateUser({
        address: userData.wallet_address,
        email: userData.email,
        name: userData.nombre,
        authMethod: 'traditional', // Todos usan Stellar ahora
        clabe: userData.clabe
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
          wallet_address: address, // Dirección Stellar (G...)
          clabe: encryptedSecretKey, // Secret key encriptada (antes era CLABE bancaria)
          auth_method,
          api_key: undefined // Ya no usamos api_key para la secret key
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
      
      if (onStepChange) onStepChange('Finalizando registro...');
      
      // 4. Limpiar cualquier balance o transacciones previas antes de crear la cuenta
      // Esto asegura que cada nueva cuenta empiece con balance en 0
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
      // También limpiar la clave genérica
      localStorage.removeItem('pumapay_mxnb_balance');
      localStorage.removeItem('pumapay_transactions');
      
      // 5. Guardar usuario autenticado en localStorage
      // NOTA: No guardamos la secret key en localStorage por seguridad
      // El usuario necesitará hacer login para acceder a su cuenta
      const userData: User = {
        email,
        name: nombre,
        address,
        authMethod: 'traditional'
      };
      updateUser(userData);
      
      setIsLoading(false);
      console.log('✅ Registro completado exitosamente');
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
  const logout = () => {
    // Limpiar balance y transacciones del usuario actual antes de hacer logout
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
    // También limpiar la clave genérica por si acaso
    localStorage.removeItem('pumapay_mxnb_balance');
    localStorage.removeItem('pumapay_transactions');
    
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // ⚠️ COMENTADO - Ya no usamos Portal
    // portalService.logout();
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