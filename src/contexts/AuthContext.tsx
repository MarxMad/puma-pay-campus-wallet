import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalService } from '@/services/portal';
import { junoService } from '@/services/junoService';
import { registrarUsuario, loginUsuario } from '@/services/userService';
import { asignarApiKeyAUsuario } from '@/services/portalApiKeyService';
import { supabase } from '@/services/supabaseClient';

interface User {
  address: string;
  email?: string;
  name?: string;
  authMethod: 'portal' | 'traditional';
  clabe?: string;
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
          
          // Si es usuario de Portal, sincronizar con el servicio
          if (userData.authMethod === 'portal') {
            // Restaurar estado en el servicio Portal
            portalService.setCurrentUser({ address: userData.address });
          }
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
      // Guardar usuario autenticado en localStorage
      updateUser({
        address: userData.wallet_address,
        email: userData.email,
        name: userData.nombre,
        authMethod: userData.auth_method as 'portal' | 'traditional',
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
  const loginWithPortal = async (method: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      let result;
      if (method === 'google') {
        result = await portalService.loginWithGoogle();
      } else {
        result = await portalService.loginWithApple();
      }

      const userData: User = {
        address: result.address,
        name: method === 'google' ? 'Usuario Google' : 'Usuario Apple',
        authMethod: 'portal'
      };

      updateUser(userData);
    } catch (error) {
      console.error('Error en login Portal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Crear cuenta nueva
  const createAccount = async (email: string, password: string, name: string, studentId: string) => {
    setIsLoading(true);
    try {
      await portalService.logout();
      // 1. Registrar usuario en Supabase (sin wallet ni clabe)
      const nombre = name;
      const apellido = '';
      const auth_method = 'traditional';
      const userInsert = await registrarUsuario({
        nombre,
        apellido,
        email,
        password,
        wallet_address: '', // aún no
        clabe: '', // aún no
        auth_method
      });
      // 2. Obtener el userId del usuario creado
      // registrarUsuario retorna un array con el usuario insertado
      const userId = userInsert && Array.isArray(userInsert) && userInsert[0]?.id;
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');
      // 3. Asignar una API Key de Portal
      const apiKeyObj = await asignarApiKeyAUsuario(userId);
      // 4. Usar esa API Key y Client ID para crear la wallet de Portal
      // Siempre pasar los valores obtenidos de Supabase
      await portalService.onReady();
      const wallet = await portalService.createWallet({
        apiKey: apiKeyObj.api_key, // de Supabase
        clientId: apiKeyObj.client_id // de Supabase
      });
      const address = wallet.address || (await portalService.getWalletAddress());
      // 5. Crear la cuenta CLABE
      let clabe: string | undefined = undefined;
      try {
        const clabeResult = await junoService.createUserClabe();
        clabe = clabeResult.clabe;
      } catch (e) {
        console.error('No se pudo crear la CLABE:', e);
      }
      // 6. Actualizar el usuario en Supabase con la wallet y la clabe
      await supabase
        .from('usuarios')
        .update({ wallet_address: address, clabe })
        .eq('id', userId);
      // 7. Guardar usuario autenticado en localStorage
      const userData: User = {
        email,
        name: nombre,
        address,
        authMethod: 'traditional',
        clabe,
      };
      updateUser(userData);
      setIsLoading(false);
      return { address, clabe };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    portalService.logout();
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
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}; 

// NOTA: Durante el signup, el usuario solo verá el spinner. Todo el proceso de registro, asignación de API Key, creación de wallet y CLABE ocurre en background antes de navegar a /home o mostrar el éxito. 