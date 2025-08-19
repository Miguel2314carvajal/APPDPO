import api from './api';
import { LoginCredentials, RegisterUserData, AuthResponse } from '../types';

export const authService = {
  // Login de usuario
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/users/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error en el login' };
    }
  },

  // Registro de usuario (solo admin puede registrar)
  registerUser: async (userData: RegisterUserData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/users/registro', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error en el registro' };
    }
  },

  // Obtener perfil del usuario
  getProfile: async (): Promise<any> => {
    try {
      const response = await api.get('/users/perfil');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al obtener perfil' };
    }
  },

  // Actualizar perfil del usuario
  updateProfile: async (userData: Partial<RegisterUserData>): Promise<any> => {
    try {
      const response = await api.put('/users/actualizar', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al actualizar perfil' };
    }
  },

  // Listar todos los usuarios (solo admin)
  listUsers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/users/listar');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al listar usuarios' };
    }
  },

  // Eliminar usuario (solo admin)
  deleteUser: async (userId: string): Promise<any> => {
    try {
      const response = await api.delete(`/users/eliminar/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al eliminar usuario' };
    }
  }
};
