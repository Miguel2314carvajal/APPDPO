import api from './api';
import { Folder, CreateNestedFolderData, NestedFolderTree } from '../types';

export interface CreateFolderData {
  name: string;
  category: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
  description?: string;
  parentFolder?: string | null;
  subfolders?: CreateNestedFolderData[];
}

export interface UpdateFolderData {
  name?: string;
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

  // Eliminar carpetas vacías (solo admin)
  async deleteEmptyFolders(): Promise<void> {
    try {
      await api.post('/api/folders/limpiar');
    } catch (error: any) {
      console.error('Error eliminando carpetas vacías:', error);
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

  // ===== FUNCIONES PARA CARPETAS ANIDADAS =====

  // Crear carpeta anidada con subcarpetas
  async createNestedFolder(folderData: CreateNestedFolderData): Promise<Folder> {
    try {
      console.log('📁 Creando carpeta anidada:', folderData);
      const response = await api.post('/api/folders/crear-anidada', folderData);
      console.log('✅ Carpeta anidada creada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creando carpeta anidada:', error);
      throw error;
    }
  }

  // Obtener estructura jerárquica completa
  async getHierarchicalStructure(): Promise<NestedFolderTree[]> {
    try {
      const response = await api.get('/api/folders/estructura/jerarquica');
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo estructura jerárquica:', error);
      throw error;
    }
  }

  // Obtener subcarpetas de una carpeta específica
  async getSubfolders(folderId: string): Promise<Folder[]> {
    try {
      const response = await api.get(`/api/folders/${folderId}/subcarpetas`);
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo subcarpetas:', error);
      throw error;
    }
  }

  // Agregar subcarpeta a una carpeta existente
  async addSubfolder(folderId: string, subfolderData: { name: string; category: string }): Promise<Folder> {
    try {
      const response = await api.post(`/api/folders/${folderId}/subcarpetas`, subfolderData);
      return response.data;
    } catch (error: any) {
      console.error('Error agregando subcarpeta:', error);
      throw error;
    }
  }

  // Obtener ruta de una carpeta
  async getFolderPath(folderId: string): Promise<{ path: string[]; folder: Folder }> {
    try {
      const response = await api.get(`/api/folders/${folderId}/ruta`);
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo ruta de carpeta:', error);
      throw error;
    }
  }

  // Obtener carpetas por categoría
  async getFoldersByCategory(category: string): Promise<{ category: string; folders: Folder[] }> {
    try {
      const response = await api.get(`/api/folders/categoria/${category}`);
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo carpetas por categoría:', error);
      throw error;
    }
  }
}

export const folderService = new FolderService();
