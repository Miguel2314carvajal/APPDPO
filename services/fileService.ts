import api from './api';

export interface File {
  _id: string;
  name: string;
  description: string;
  folder: string;
  url: string;
  publicId?: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileData {
  nombre: string;
  descripcion: string;
  carpetaId: string;
  archivo: any;
}

export interface UpdateFileData {
  nombre?: string;
  descripcion?: string;
}

class FileService {
  // Subir archivo a Cloudinary y guardar en MongoDB
  async uploadFile(fileData: UploadFileData): Promise<File> {
    try {
      console.log('📤 Iniciando subida de archivo:', fileData);
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      
      // Agregar el archivo
      const fileUri = fileData.archivo.uri || fileData.archivo.fileCopyUri;
      const fileName = fileData.archivo.name || 'archivo';
      const fileType = fileData.archivo.mimeType || 'application/octet-stream';
      
      console.log('📁 Archivo a subir:', { fileUri, fileName, fileType });
      
      const fileToUpload = {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any;
      
      console.log('📎 Objeto archivo creado:', fileToUpload);
      
      formData.append('file', fileToUpload);
      
      // Agregar metadatos - usar 'folder' en lugar de 'carpetaId'
      formData.append('name', fileData.nombre);
      formData.append('description', fileData.descripcion);
      formData.append('folder', fileData.carpetaId);
      
      console.log('📋 FormData creado, enviando al backend...');
      console.log('📋 FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      // Subir archivo
      const response = await api.post('/files/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos para archivos grandes
      });
      
      console.log('✅ Archivo subido exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      if (error.response) {
        console.error('📊 Respuesta del error:', error.response.data);
        console.error('🔢 Status del error:', error.response.status);
        console.error('📋 Headers del error:', error.response.headers);
      }
      throw error;
    }
  }

  // Listar todos los archivos
  async listFiles(): Promise<File[]> {
    try {
      const response = await api.get('/files/listar');
      return response.data;
    } catch (error) {
      console.error('Error listando archivos:', error);
      throw error;
    }
  }

  // Obtener archivo específico
  async getFile(fileId: string): Promise<File> {
    try {
      const response = await api.get(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo archivo:', error);
      throw error;
    }
  }

  // Obtener archivos de una carpeta específica
  async getFilesByFolder(folderId: string): Promise<File[]> {
    try {
      const response = await api.get(`/files/carpeta/${folderId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo archivos de carpeta:', error);
      throw error;
    }
  }

  // Actualizar archivo
  async updateFile(fileId: string, fileData: UpdateFileData): Promise<File> {
    try {
      const response = await api.put(`/files/${fileId}`, fileData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando archivo:', error);
      throw error;
    }
  }

  // Eliminar archivo (también de Cloudinary)
  async deleteFile(fileId: string): Promise<void> {
    try {
      await api.delete(`/files/${fileId}`);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      throw error;
    }
  }

  // Descargar archivo
  async downloadFile(fileId: string): Promise<{ url: string; fileName: string }> {
    try {
      const response = await api.get(`/files/${fileId}/descargar`);
      return response.data;
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw error;
    }
  }

  // Buscar archivos por nombre o descripción
  async searchFiles(query: string): Promise<File[]> {
    try {
      const response = await api.get(`/files/buscar?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error buscando archivos:', error);
      throw error;
    }
  }

  // Obtener estadísticas de archivos
  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    recentFiles: File[];
  }> {
    try {
      const response = await api.get('/files/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Verificar si un archivo existe
  async fileExists(fileName: string, folderId: string): Promise<boolean> {
    try {
      const response = await api.get(`/files/existe?nombre=${encodeURIComponent(fileName)}&carpetaId=${folderId}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error verificando existencia de archivo:', error);
      return false;
    }
  }

  // Obtener tipos de archivo permitidos
  async getAllowedFileTypes(): Promise<string[]> {
    try {
      const response = await api.get('/files/tipos-permitidos');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tipos permitidos:', error);
      // Tipos por defecto si falla la API
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
    }
  }

  // Validar archivo antes de subir
  validateFile(file: any): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!file) {
      return { isValid: false, error: 'No se seleccionó ningún archivo' };
    }
    
    if (file.size && file.size > maxSize) {
      return { isValid: false, error: 'El archivo es demasiado grande. Máximo 50MB' };
    }
    
    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (file.mimeType && !allowedTypes.includes(file.mimeType)) {
      return { isValid: false, error: 'Tipo de archivo no permitido' };
    }
    
    return { isValid: true };
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obtener icono según tipo de archivo
  getFileIcon(fileName: string, mimeType?: string): string {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.startsWith('video/')) return '🎥';
    if (mimeType?.startsWith('audio/')) return '🎵';
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      case 'txt':
        return '📄';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  }
}

export const fileService = new FileService();
