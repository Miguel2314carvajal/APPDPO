import api from './api';
import { LoginCredentials, RegisterUserData, AuthResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';

export interface UpdateUserData {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rol?: string;
  folders?: string[];
}

// Función para generar un deviceId único y PERSISTENTE
const generateDeviceId = async (): Promise<string> => {
  try {
    // Intentar obtener deviceId existente
    let deviceId = await AsyncStorage.getItem('deviceId');
    console.log('🔍 DeviceId actual en AsyncStorage:', deviceId);

    // Si NO hay deviceId o es del formato anterior, crear uno nuevo
    if (!deviceId || deviceId.includes('eyJ') || deviceId.startsWith('device_') || deviceId.length < 20) {
      console.log('🔄 Generando nuevo deviceId...');
      
      // Generar UUID manual robusto (más confiable que expo-crypto)
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      console.log('📱 Nuevo UUID generado:', deviceId);
      
      // Guardar deviceId PERMANENTEMENTE
      await AsyncStorage.setItem('deviceId', deviceId);
      console.log('💾 DeviceId guardado PERMANENTEMENTE en AsyncStorage');
    } else {
      console.log('📱 DeviceId existente reutilizado:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('❌ Error generando deviceId:', error);
    // Fallback final - pero también persistente
    const fallbackId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 15)}`;
    console.log('📱 DeviceId fallback generado:', fallbackId);
    
    // Intentar guardar el fallback también
    try {
      await AsyncStorage.setItem('deviceId', fallbackId);
      console.log('💾 DeviceId fallback guardado');
    } catch (saveError) {
      console.error('❌ Error guardando fallback:', saveError);
    }
    
    return fallbackId;
  }
};

export const authService = {
  // Login de usuario
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('🔐 Iniciando login con:', credentials.email);
      console.log('🌐 URL del backend:', api.defaults.baseURL);
      console.log('⏱️ Timeout configurado:', api.defaults.timeout);
      
      // Generar deviceId único
      const deviceId = await generateDeviceId();
      console.log('📱 DeviceId para login:', deviceId);
      
      // Agregar deviceId a los headers
      console.log('📤 Enviando petición a:', `${api.defaults.baseURL}/api/users/login`);
      console.log('📤 Headers:', { 'x-device-id': deviceId });
      console.log('📤 Body:', credentials);
      
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
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      
      // Manejar errores específicos de límite de sesiones
      if (error.response?.status === 403 && error.response?.data?.error === 'SESSION_LIMIT_REACHED') {
        throw {
          mensaje: error.response.data.message || 'Límite de sesiones alcanzado',
          error: 'SESSION_LIMIT_REACHED',
          maxSessions: error.response.data.maxSessions,
          activeSessions: error.response.data.activeSessions
        };
      }
      
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
  },

  // Limpiar deviceId (para testing)
  async clearDeviceId(): Promise<void> {
    try {
      await AsyncStorage.removeItem('deviceId');
      console.log('📱 DeviceId limpiado');
    } catch (error) {
      console.error('Error limpiando deviceId:', error);
    }
  },

  // Forzar regeneración de deviceId
  async forceRegenerateDeviceId(): Promise<string | null> {
    try {
      await AsyncStorage.removeItem('deviceId');
      const newDeviceId = await generateDeviceId();
      console.log('🔄 DeviceId regenerado:', newDeviceId);
      return newDeviceId;
    } catch (error) {
      console.error('❌ Error regenerando deviceId:', error);
      return null;
    }
  },

  // Función para obtener deviceId actual sin regenerarlo
  async getCurrentDeviceId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('deviceId');
    } catch (error) {
      console.error('❌ Error obteniendo deviceId:', error);
      return null;
    }
  }
};
