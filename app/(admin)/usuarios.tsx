import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

interface User {
  _id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  rol: string;
  createdAt: string;
}

export default function UsuariosScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user: currentUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadUsers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [])
  );

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await authService.listUsers();
      setUsers(response);
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telefono.includes(searchQuery)
    );
    setFilteredUsers(filtered);
  };

  const handleDeleteUser = (user: User) => {
    if (user._id === currentUser?._id) {
      Alert.alert('Error', 'No puedes eliminar tu propia cuenta');
      return;
    }

    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar a ${user.nombres} ${user.apellidos}?\n\nEsta acción no se puede deshacer y el usuario perderá acceso a todas las carpetas asignadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteUser(user.cedula);
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
    navigation.navigate('EditarUsuario', { cedula: user.cedula });
  };

  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Gestión de Usuarios</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigateTo('NuevoUsuario')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Buscar usuarios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#95a5a6"
        />
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.rol === 'admin').length}
          </Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.rol === 'user').length}
          </Text>
          <Text style={styles.statLabel}>Usuarios</Text>
        </View>
      </View>

      {/* Lista de usuarios */}
      <ScrollView 
        style={styles.usersList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshUsers} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateTitle}>No hay usuarios</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No se encontraron usuarios con esa búsqueda' : 'Comienza creando el primer usuario'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigateTo('NuevoUsuario')}
              >
                <Text style={styles.emptyStateButtonText}>Crear Usuario</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user._id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>
                    {user.nombres?.[0] || 'U'}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {user.nombres} {user.apellidos}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userPhone}>{user.telefono}</Text>
                  <Text style={styles.userRole}>
                    {user.rol === 'admin' ? '👑 Administrador' : '👤 Usuario'}
                  </Text>
                  <Text style={styles.userDate}>
                    Creado: {formatDate(user.createdAt)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditUser(user)}
                >
                  <View style={styles.actionButtonContent}>
                    <Ionicons name="create" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </View>
                </TouchableOpacity>
                
                {user._id !== currentUser?._id && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <View style={styles.actionButtonContent}>
                      <Ionicons name="trash" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Eliminar</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Botón flotante */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigateTo('NuevoUsuario')}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#3498db',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  emptyStateButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  userActions: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  actionButton: {
    width: 80,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});
