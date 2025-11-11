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
      
      // Re-inicializar Portal con las credenciales del usuario
      if (userData.api_key) {
        console.log('🔄 Re-inicializando Portal con credenciales del usuario...');
        await portalService.initialize({
          apiKey: userData.api_key,
          clientId: userData.client_id
        });
        console.log('✅ Portal re-inicializado correctamente');
      }
      
      // Sincronizar usuario con Portal Service
      portalService.setCurrentUser({ address: userData.wallet_address });
      
      // Guardar usuario autenticado en localStorage
      updateUser({
        address: userData.wallet_address,
        email: userData.email,
        name: userData.nombre,
        authMethod: userData.auth_method as 'portal' | 'traditional',
        clabe: userData.clabe,
        apiKey: userData.api_key,
        clientId: userData.client_id
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
      await portalService.logout();
      const nombre = name;
      const apellido = '';
      const auth_method = 'traditional';
      if (onStepChange) onStepChange('Guardando usuario...');
      // 1. Guardar usuario en Supabase (sin wallet ni clabe)
      const userInsert = await registrarUsuario({
        nombre,
        apellido,
        email,
        password,
        wallet_address: '',
        clabe: '',
        auth_method
      });
      const userId = userInsert && Array.isArray(userInsert) && userInsert[0]?.id;
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');
      if (onStepChange) onStepChange('Asignando credenciales seguras...');
      // 2. Asignar API Key y Client ID
      const apiKeyObj = await asignarApiKeyAUsuario(userId);
      if (onStepChange) onStepChange('Creando wallet segura...');
      // 3. Crear wallet de Portal
      let wallet;
      try {
        wallet = await portalService.createWallet({
          apiKey: apiKeyObj.api_key,
          clientId: apiKeyObj.client_id
        });
        console.log('Wallet creada:', wallet);
      } catch (error) {
        console.error('Error al crear wallet:', error);
        setIsLoading(false);
        throw new Error('No se pudo crear la wallet. Revisa la consola para más detalles.');
      }
      const address = wallet.address || (await portalService.getWalletAddress());
      // Backup automático de la wallet usando la contraseña del registro
      if (onStepChange) onStepChange('Respaldando tu wallet...');
      try {
        await portalService.backupWallet(password);
        console.log('✅ Backup de wallet realizado correctamente');
      } catch (error) {
        console.warn('⚠️ No se pudo respaldar la wallet, pero se continuará con el registro:', error);
        // NO lanzamos error, solo avisamos
      }
      if (onStepChange) onStepChange('Creando cuenta CLABE...');
      // 4. Crear la cuenta CLABE
      let clabe: string | undefined = undefined;
      try {
        const clabeResult = await junoService.createUserClabe();
        clabe = clabeResult.clabe;
      } catch (e) {
        console.error('No se pudo crear la CLABE:', e);
        setIsLoading(false);
        throw new Error('No se pudo crear la cuenta CLABE. Revisa la consola para más detalles.');
      }
      if (onStepChange) onStepChange('Finalizando registro...');
      // 5. Actualizar el usuario en Supabase con wallet y clabe
      await supabase
        .from('usuarios')
        .update({ wallet_address: address, clabe })
        .eq('id', userId);
      // 6. Guardar usuario autenticado en localStorage
      const userData: User = {
        email,
        name: nombre,
        address,
        authMethod: 'traditional',
        clabe,
        apiKey: apiKeyObj.api_key,
        clientId: apiKeyObj.client_id
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