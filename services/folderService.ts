import api from './api';

export interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderData {
  name: string;
  files?: string[];
}

export interface UpdateFolderData {
  nombre?: string;
  descripcion?: string;
  usuarios?: string[];
}

class FolderService {
  // Listar todas las carpetas (para admin)
  async listFolders(): Promise<Folder[]> {
    try {
      const response = await api.get('/api/folders/listar');
      return response.data;
    } catch (error: any) {
      console.error('Error listando carpetas:', error);
      throw error;
    }
  }

  // Obtener una carpeta específica
  async getFolder(folderId: string): Promise<Folder> {
    try {
      const response = await api.get(`/api/folders/${folderId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo carpeta:', error);
      throw error;
    }
  }

  // Crear nueva carpeta (solo admin)
  async createFolder(folderData: CreateFolderData): Promise<Folder> {
    try {
      console.log('Enviando datos para crear carpeta:', folderData);
      const response = await api.post('/api/folders/crear', folderData);
      console.log('Respuesta del backend:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creando carpeta:', error);
      if (error.response) {
        console.error('Respuesta del error:', error.response.data);
        console.error('Status del error:', error.response.status);
      }
      throw error;
    }
  }

  // Actualizar carpeta (solo admin)
  async updateFolder(folderId: string, folderData: UpdateFolderData): Promise<Folder> {
    try {
      const response = await api.put(`/api/folders/${folderId}`, folderData);
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando carpeta:', error);
      throw error;
    }
  }

  // Eliminar carpeta (solo admin)
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await api.delete(`/api/folders/${folderId}`);
    } catch (error: any) {
      console.error('Error eliminando carpeta:', error);
      throw error;
    }
  }

  // Asignar usuarios a una carpeta (solo admin)
  async assignUsersToFolder(folderId: string, userIds: string[]): Promise<Folder> {
    try {
      const response = await api.put(`/api/folders/${folderId}/usuarios`, { usuarios: userIds });
      return response.data;
    } catch (error: any) {
      console.error('Error asignando usuarios a carpeta:', error);
      throw error;
    }
  }

  // Obtener carpetas de un usuario específico
  async getUserFolders(userId: string): Promise<Folder[]> {
    try {
      const response = await api.get(`/api/folders/usuario/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo carpetas del usuario:', error);
      throw error;
    }
  }
}

export const folderService = new FolderService();
