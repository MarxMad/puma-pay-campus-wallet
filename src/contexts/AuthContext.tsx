import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalService } from '@/services/portal';

interface User {
  address: string;
  email?: string;
  name?: string;
  authMethod: 'portal' | 'traditional';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPortal: (method: 'google' | 'apple') => Promise<void>;
  logout: () => void;
  createAccount: (email: string, password: string, name: string, studentId: string) => Promise<void>;
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
  const saveAuth = (userData: User) => {
    console.log('💾 Guardando datos de autenticación:', userData);
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  // Login tradicional con email/password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simular validación (aquí irían las validaciones reales)
      const storedAccounts = JSON.parse(localStorage.getItem('pumapay_accounts') || '[]');
      const account = storedAccounts.find((acc: any) => acc.email === email && acc.password === password);
      
      if (!account) {
        throw new Error('Credenciales incorrectas');
      }

      // Crear wallet MPC si no existe
      const { address } = await portalService.createWallet();

      const userData: User = {
        address,
        email: account.email,
        name: account.name,
        authMethod: 'traditional'
      };

      saveAuth(userData);
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

      saveAuth(userData);
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
      // Guardar cuenta en localStorage (en producción sería una API)
      const storedAccounts = JSON.parse(localStorage.getItem('pumapay_accounts') || '[]');
      
      // Verificar si ya existe la cuenta
      if (storedAccounts.some((acc: any) => acc.email === email)) {
        throw new Error('Ya existe una cuenta con este email');
      }

      const newAccount = {
        email,
        password,
        name,
        studentId,
        createdAt: new Date().toISOString()
      };

      storedAccounts.push(newAccount);
      localStorage.setItem('pumapay_accounts', JSON.stringify(storedAccounts));

      // Crear wallet MPC automáticamente
      const { address } = await portalService.createWallet();

      const userData: User = {
        address,
        email,
        name,
        authMethod: 'traditional'
      };

      saveAuth(userData);
    } catch (error) {
      console.error('Error creando cuenta:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
      createAccount
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