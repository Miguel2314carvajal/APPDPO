import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { folderService } from '../services/folderService';
import { Folder } from '../types';

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFolders = useCallback(async () => {
    try {
      console.log('🔄 Cargando carpetas...');
      setIsLoading(true);
      const data = await folderService.getHierarchicalStructure();
      
      let foldersData: Folder[] = [];
      if (Array.isArray(data)) {
        foldersData = data;
      } else if (data && Array.isArray((data as any).carpetas)) {
        foldersData = (data as any).carpetas;
      } else if (data && Array.isArray((data as any).folders)) {
        foldersData = (data as any).folders;
      } else {
        console.warn('⚠️ Formato de datos inesperado:', data);
        foldersData = [];
      }
      
      setFolders(foldersData);
      setFilteredFolders(foldersData);
    } catch (error: any) {
      console.error('❌ Error cargando carpetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
      setFolders([]);
      setFilteredFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFolders = useCallback(async () => {
    setIsRefreshing(true);
    await loadFolders();
    setIsRefreshing(false);
  }, [loadFolders]);

  const filterFolders = useCallback(() => {
    if (!Array.isArray(folders)) {
      setFilteredFolders([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredFolders(folders);
      return;
    }

    const filtered = folders.filter(folder => 
      folder.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFolders(filtered);
  }, [folders, searchQuery]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    filterFolders();
  }, [filterFolders]);

  return {
    folders,
    filteredFolders,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    loadFolders,
    refreshFolders,
    filterFolders
  };
};
