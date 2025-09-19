// Configuración de la aplicación
export const CONFIG = {
  // Backend URLs
  BACKEND_URL: 'https://auditorias-backend-production.up.railway.app', // Usar siempre producción
  
  // Timeouts
  API_TIMEOUT: 15000, // 15 segundos para Railway (más rápido)
  
  // Configuración de la app
  APP_NAME: 'AuditoriasApp',
  APP_VERSION: '1.0.0',
  
  // Configuración de archivos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
};

// Función para obtener la URL del backend
export const getBackendUrl = () => {
  return CONFIG.BACKEND_URL;
};

// Función para verificar si estamos en desarrollo
export const isDevelopment = () => {
  return __DEV__;
};
