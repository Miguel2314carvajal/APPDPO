import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterUserData } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un usuario guardado al iniciar
  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error al verificar usuario guardado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Iniciando login con:', credentials.email);
      
      // Llamar al backend real
      const response = await authService.login(credentials);
      console.log('✅ Respuesta del backend:', response);
      console.log('📍 Dirección en respuesta:', response.direccion);
      
      // Usar los datos reales del backend
      const realUser: User = {
        _id: response._id,
        nombres: response.nombres,
        apellidos: response.apellidos,
        cedula: response.cedula || '',
        telefono: response.telefono || '',
        email: response.email,
        direccion: response.direccion || '',
        rol: response.rol,
        folders: response.folders || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🏠 Dirección en usuario creado:', realUser.direccion);

      const realToken = response.token;
      console.log('🔑 Token recibido:', realToken ? 'SÍ' : 'NO');
      console.log('👤 Usuario creado:', realUser);

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(realUser));
      await AsyncStorage.setItem('token', realToken);
      console.log('💾 Datos guardados en AsyncStorage');

      setUser(realUser);
      console.log('✅ Login completado exitosamente');
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterUserData) => {
    try {
      setIsLoading(true);
      
      // Aquí se hará la llamada a la API
      // Por ahora simulamos el registro
      const mockUser: User = {
        _id: '2',
        ...userData,
        rol: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockToken = 'mock-token-456';

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', mockToken);

      setUser(mockUser);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
