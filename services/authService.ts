import api from './api';
import { LoginCredentials, RegisterUserData, AuthResponse } from '../types';

export interface UpdateUserData {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rol?: string;
  carpetaId?: string;
}

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
  registerUser: async (userData: RegisterUserData & { carpetaId?: string }): Promise<AuthResponse> => {
    try {
      // Si se proporciona carpetaId, lo convertimos a array de folders
      const dataToSend = {
        ...userData,
        folders: userData.carpetaId ? [userData.carpetaId] : []
      };
      
      const response = await api.post('/users/registro', dataToSend);
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

  // Obtener usuario específico por cédula
  getUserByCedula: async (cedula: string): Promise<any> => {
    try {
      const response = await api.get(`/users/cedula/${cedula}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al obtener usuario' };
    }
  },

  // Actualizar usuario (solo admin)
  updateUser: async (cedula: string, userData: UpdateUserData): Promise<any> => {
    try {
      const response = await api.put(`/users/actualizar/${cedula}`, userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al actualizar usuario' };
    }
  },

  // Eliminar usuario (solo admin)
  deleteUser: async (cedula: string): Promise<any> => {
    try {
      const response = await api.delete(`/users/eliminar/${cedula}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al eliminar usuario' };
    }
  }
};
