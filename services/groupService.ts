import api from './api';

export interface Group {
  _id: string;
  name: string;
  description: string;
  users: Array<{
    _id: string;
    email: string;
    companyName: string;
    category: string;
  }>;
  maxSessions: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  users?: string[];
  category?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  users?: string[];
  category?: string;
}

export const groupService = {
  // Crear nuevo grupo
  createGroup: async (groupData: CreateGroupData): Promise<Group> => {
    try {
      console.log('🔄 Creando grupo:', groupData);
      const response = await api.post('/api/groups/crear', groupData);
      console.log('✅ Grupo creado:', response.data);
      return response.data.group;
    } catch (error: any) {
      console.error('❌ Error creando grupo:', error);
      throw error.response?.data || { mensaje: 'Error al crear grupo' };
    }
  },

  // Listar todos los grupos
  getGroups: async (): Promise<Group[]> => {
    try {
      console.log('🔄 Obteniendo grupos...');
      const response = await api.get('/api/groups/listar');
      console.log('✅ Grupos obtenidos:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo grupos:', error);
      throw error.response?.data || { mensaje: 'Error al obtener grupos' };
    }
  },

  // Obtener un grupo específico
  getGroup: async (groupId: string): Promise<Group> => {
    try {
      console.log('🔄 Obteniendo grupo:', groupId);
      const response = await api.get(`/api/groups/${groupId}`);
      console.log('✅ Grupo obtenido:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo grupo:', error);
      throw error.response?.data || { mensaje: 'Error al obtener grupo' };
    }
  },

  // Actualizar grupo
  updateGroup: async (groupId: string, groupData: UpdateGroupData): Promise<Group> => {
    try {
      console.log('🔄 Actualizando grupo:', groupId, groupData);
      const response = await api.put(`/api/groups/${groupId}`, groupData);
      console.log('✅ Grupo actualizado:', response.data);
      return response.data.group;
    } catch (error: any) {
      console.error('❌ Error actualizando grupo:', error);
      throw error.response?.data || { mensaje: 'Error al actualizar grupo' };
    }
  },

  // Eliminar grupo
  deleteGroup: async (groupId: string): Promise<void> => {
    try {
      console.log('🔄 Eliminando grupo:', groupId);
      const response = await api.delete(`/api/groups/${groupId}`);
      console.log('✅ Grupo eliminado:', response.data);
    } catch (error: any) {
      console.error('❌ Error eliminando grupo:', error);
      throw error.response?.data || { mensaje: 'Error al eliminar grupo' };
    }
  },

  // Agregar usuario al grupo
  addUserToGroup: async (groupId: string, userId: string): Promise<void> => {
    try {
      console.log('🔄 Agregando usuario al grupo:', groupId, userId);
      const response = await api.post(`/api/groups/${groupId}/usuarios/${userId}`);
      console.log('✅ Usuario agregado al grupo:', response.data);
    } catch (error: any) {
      console.error('❌ Error agregando usuario al grupo:', error);
      throw error.response?.data || { mensaje: 'Error al agregar usuario al grupo' };
    }
  },

  // Remover usuario del grupo
  removeUserFromGroup: async (groupId: string, userId: string): Promise<void> => {
    try {
      console.log('🔄 Removiendo usuario del grupo:', groupId, userId);
      const response = await api.delete(`/api/groups/${groupId}/usuarios/${userId}`);
      console.log('✅ Usuario removido del grupo:', response.data);
    } catch (error: any) {
      console.error('❌ Error removiendo usuario del grupo:', error);
      throw error.response?.data || { mensaje: 'Error al remover usuario del grupo' };
    }
  }
};
