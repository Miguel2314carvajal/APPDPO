import api from './api';
import { LoginCredentials, RegisterUserData, AuthResponse } from '../types';

export interface UpdateUserData {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rol?: string;
  folders?: string[];
}

export const authService = {
  // Login de usuario
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/users/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error en el login' };
    }
  },

  // Registro de usuario (solo admin puede registrar)
  registerUser: async (userData: RegisterUserData & { folders?: string[] }): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/users/registro', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error en el registro' };
    }
  },

  // Obtener perfil del usuario
  getProfile: async (): Promise<any> => {
    try {
      const response = await api.get('/api/users/perfil');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al obtener perfil' };
    }
  },

  // Actualizar perfil del usuario
  updateProfile: async (userData: Partial<RegisterUserData>): Promise<any> => {
    try {
      const response = await api.put('/api/users/actualizar', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al actualizar perfil' };
    }
  },

  // Listar todos los usuarios (solo admin)
  listUsers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/api/users/listar');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al listar usuarios' };
    }
  },

  // Obtener usuario específico por cédula
  getUserByCedula: async (cedula: string): Promise<any> => {
    try {
      const response = await api.get(`/api/users/cedula/${cedula}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al obtener usuario' };
    }
  },

  // Actualizar usuario (solo admin)
  updateUser: async (cedula: string, userData: UpdateUserData): Promise<any> => {
    try {
      const response = await api.put(`/api/users/actualizar/${cedula}`, userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al actualizar usuario' };
    }
  },

  // Eliminar usuario (solo admin)
  deleteUser: async (cedula: string): Promise<any> => {
    try {
      const response = await api.delete(`/api/users/eliminar/${cedula}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al eliminar usuario' };
    }
  },

  // Sincronizar carpetas del usuario
  async syncUserFolders(userId: string): Promise<any> {
    try {
      const response = await api.post(`/api/users/sincronizar-carpetas/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error sincronizando carpetas:', error);
      throw error;
    }
  },

  // Cambiar contraseña del usuario
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    try {
      const response = await api.post('/api/users/cambiar-contrasena', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      throw error.response?.data || { mensaje: 'Error al cambiar contraseña' };
    }
  }
};
