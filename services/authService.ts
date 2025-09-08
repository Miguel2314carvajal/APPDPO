import api from './api';
import { LoginCredentials, RegisterUserData, AuthResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export interface UpdateUserData {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rol?: string;
  folders?: string[];
}

// Función para generar un deviceId único
const generateDeviceId = async (): Promise<string> => {
  try {
    // Intentar obtener deviceId existente
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!deviceId) {
      // Generar nuevo deviceId basado en características del dispositivo
      const deviceInfo = {
        platform: Platform.OS,
        brand: Device.brand || 'unknown',
        model: Device.modelName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
        timestamp: Date.now().toString()
      };
      
      // Crear un hash simple del deviceInfo
      const deviceString = JSON.stringify(deviceInfo);
      deviceId = btoa(deviceString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      // Guardar deviceId
      await AsyncStorage.setItem('deviceId', deviceId);
      console.log('📱 Nuevo deviceId generado:', deviceId);
    } else {
      console.log('📱 DeviceId existente:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('❌ Error generando deviceId:', error);
    // Fallback a un ID aleatorio
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

export const authService = {
  // Login de usuario
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('🔐 Iniciando login con:', credentials.email);
      console.log('🌐 URL del backend:', api.defaults.baseURL);
      
      // Generar deviceId único
      const deviceId = await generateDeviceId();
      console.log('📱 DeviceId para login:', deviceId);
      
      // Agregar deviceId a los headers
      const response = await api.post('/api/users/login', credentials, {
        headers: {
          'x-device-id': deviceId
        }
      });
      console.log('✅ Respuesta del backend:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
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

  // Obtener usuario por ID (solo admin)
  getUserById: async (userId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al obtener usuario' };
    }
  },

  // Actualizar usuario (solo admin)
  updateUser: async (userId: string, userData: UpdateUserData): Promise<any> => {
    try {
      const response = await api.put(`/api/users/actualizar/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { mensaje: 'Error al actualizar usuario' };
    }
  },

  // Eliminar usuario (solo admin)
  deleteUser: async (userId: string): Promise<any> => {
    try {
      const response = await api.delete(`/api/users/eliminar/${userId}`);
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
  },

  // Cerrar otras sesiones
  async closeOtherSessions(): Promise<any> {
    try {
      const deviceId = await generateDeviceId();
      const response = await api.post('/api/users/cerrar-otras-sesiones', {
        deviceId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error cerrando otras sesiones:', error);
      throw error.response?.data || { mensaje: 'Error al cerrar otras sesiones' };
    }
  },

  // Obtener sesiones activas
  async getActiveSessions(): Promise<any> {
    try {
      const response = await api.get('/api/users/sesiones-activas');
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo sesiones activas:', error);
      throw error.response?.data || { mensaje: 'Error al obtener sesiones activas' };
    }
  }
};
