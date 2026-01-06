/**
 * Contexto de Autenticação
 * 
 * Prove estado global de autenticação para toda a aplicação.
 * Permite que qualquer componente acesse informações do usuário
 * e funções de login/logout.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { usersService } from '../services/users';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthContextType,
} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega usuário do localStorage ao inicializar e busca atualização
  useEffect(() => {
    const loadUser = async () => {
      let loadedFromCache = false;
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && authService.isAuthenticated()) {
          setUser(currentUser);
          loadedFromCache = true;
        }
      } catch (error) {
        console.error('Error loading user from cache:', error);
      }

      // Mesmo se carregou do cache, ou se não carregou, tentamos buscar do servidor se tiver token
      if (authService.isAuthenticated()) {
        try {
          const updatedUser = await usersService.getMe();
          setUser(updatedUser);
          authService.updateStoredUser(updatedUser);
        } catch (error) {
          console.error('Error fetching fresh user data:', error);
          // Se falhar refresh e não tinha cache, estamos deslogados ou sem rede
          if (!loadedFromCache) {
             // Opcional: logout? Por enquanto mantemos comportamento padrão
          }
        }
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    authService.updateStoredUser(updatedUser);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    if (!authService.isAuthenticated()) return;
    try {
      // Busca dados atualizados do servidor
      const updatedUser = await usersService.getMe();
      // Atualiza no estado e no localStorage
      updateUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar o contexto de autenticação
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
