import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { User } from '../../types';
import { useUsers } from '../../hooks/useUsers';
import SearchBar from '../../components/common/SearchBar';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';

export default function GestionUsuariosScreen() {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  
  const {
    users,
    filteredUsers,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    loadUsers,
    refreshUsers
  } = useUsers();

  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar a ${user.companyName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteUser(user._id);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              loadUsers(); // Recargar lista
            } catch (error: any) {
              console.error('Error eliminando usuario:', error);
              const errorMessage = error.response?.data?.msg || 'No se pudo eliminar el usuario';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleEditUser = (user: User) => {
    (navigation as any).navigate('EditarUsuario', { userId: user._id });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingScreen message="Cargando usuarios..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshUsers} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
            <Text style={styles.headerSubtitle}>Administra los usuarios del sistema</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('NuevoUsuario')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar usuarios..."
        />

        {/* Lista de usuarios */}
        <View style={styles.usersContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#2c3e50" />
            <Text style={styles.sectionTitle}>
              Usuarios ({filteredUsers.length})
            </Text>
          </View>
          
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title={searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
              message={searchQuery 
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea el primer usuario del sistema'
              }
              buttonText={!searchQuery ? 'Crear Usuario' : undefined}
              onButtonPress={!searchQuery ? () => (navigation as any).navigate('NuevoUsuario') : undefined}
            />
          ) : (
            <View style={styles.usersList}>
              {filteredUsers.map((user) => (
                <View key={user._id} style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userInitial}>
                      {user.companyName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </Text>
                  </View>
                  
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.companyName}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    
                    <View style={styles.userDetails}>
                      <View style={styles.userRoleContainer}>
                        <Ionicons 
                          name={user.rol === 'admin' ? 'shield' : 'person'} 
                          size={14} 
                          color={user.rol === 'admin' ? '#E74C3C' : '#3498db'} 
                        />
                        <Text style={[
                          styles.userRole,
                          { color: user.rol === 'admin' ? '#E74C3C' : '#3498db' }
                        ]}>
                          {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
                        </Text>
                      </View>
                      
                      <View style={styles.userCategoryContainer}>
                        <Ionicons name="folder" size={14} color="#27ae60" />
                        <Text style={styles.userCategory}>
                          {(user as any).category?.replace('_', ' ').toUpperCase() || 'Sin categoría'}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.userCreated}>
                      Creado: {formatDate(user.createdAt || new Date().toISOString())}
                    </Text>
                  </View>
                  
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditUser(user)}
                    >
                      <Ionicons name="create" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteUser(user)}
                      disabled={user._id === currentUser?._id}
                    >
                      <Ionicons name="trash" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  clearButton: {
    padding: 4,
  },
  usersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  usersList: {
    // No specific styles needed here, items are handled by userCard
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  userDetails: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  userRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  userCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCategory: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  userCreated: {
    fontSize: 12,
    color: '#95a5a6',
  },
  userActions: {
    flexDirection: 'column',
    marginLeft: 16,
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 80,
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  createFirstUserText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
