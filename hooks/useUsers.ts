import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { authService } from '../services/authService';
import { User } from '../types';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      console.log('🔄 Cargando usuarios...');
      setIsLoading(true);
      const response = await authService.listUsers();
      
      // Asegurar que tenemos un array válido
      const usersArray = Array.isArray(response) ? response : 
                        (response && Array.isArray((response as any).usuarios)) ? (response as any).usuarios :
                        (response && Array.isArray((response as any).users)) ? (response as any).users : [];
      
      console.log('✅ Usuarios cargados:', usersArray.length);
      setUsers(usersArray);
    } catch (error: any) {
      console.error('❌ Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  }, [loadUsers]);

  const filterUsers = useCallback(() => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  return {
    users,
    filteredUsers,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    loadUsers,
    refreshUsers,
    filterUsers
  };
};
