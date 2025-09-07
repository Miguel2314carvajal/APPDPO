import { getBackendUrl } from './config';

// Configuración para Google Drive API
export const GOOGLE_DRIVE_CONFIG = {
  // Credenciales de Google Drive API
  CLIENT_ID: 'TU_CLIENT_ID_AQUI',
  CLIENT_SECRET: 'TU_CLIENT_SECRET_AQUI',
  REDIRECT_URI: `${getBackendUrl()}/auth/google/callback`,
  
  // Scopes necesarios
  SCOPES: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
  ],
  
  // Configuración de archivos
  UPLOAD_FOLDER_ID: 'TU_FOLDER_ID_AQUI', // ID de la carpeta en Google Drive
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // URLs base
  API_BASE_URL: 'https://www.googleapis.com/drive/v3',
  UPLOAD_URL: 'https://www.googleapis.com/upload/drive/v3/files'
};

// Función para obtener URL de descarga pública
export const getPublicDownloadUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

// Función para obtener URL de vista pública
export const getPublicViewUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};
