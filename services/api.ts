import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../config/config';

// Configuración base de la API
const API_BASE_URL = getBackendUrl();

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Interceptor - Token encontrado:', token ? 'SÍ' : 'NO');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('📤 Headers configurados:', config.headers.Authorization);
      } else {
        console.log('⚠️ No hay token disponible');
      }
    } catch (error) {
      console.error('❌ Error al obtener token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // Aquí se podría redirigir al login
      } catch (storageError) {
        console.error('Error al limpiar storage:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
