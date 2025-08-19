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
  Modal,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Folder {
  _id: string;
  nombre: string;
  descripcion: string;
  archivos: any[];
  usuarios: string[];
  createdAt: string;
}

interface User {
  _id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

export default function CarpetasScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  
  // Formulario de nueva carpeta
  const [newFolder, setNewFolder] = useState({
    name: '',
    files: []
  });

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [foldersData, usersData] = await Promise.all([
        folderService.listFolders(),
        authService.listUsers()
      ]);
      setFolders(foldersData);
      setUsers(usersData.filter(u => u.rol === 'usuario')); // Solo usuarios regulares
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la carpeta');
      return;
    }

    console.log('🔍 Usuario actual:', currentUser);
    console.log('🔍 Token disponible:', await AsyncStorage.getItem('token'));

    try {
      await folderService.createFolder(newFolder);
      Alert.alert('Éxito', 'Carpeta creada correctamente');
      setShowCreateModal(false);
      setNewFolder({ name: '', files: [] });
      loadData();
    } catch (error: any) {
      console.error('Error creando carpeta:', error);
      Alert.alert('Error', 'No se pudo crear la carpeta');
    }
  };

  const handleAssignUsers = async (folderId: string, userIds: string[]) => {
    try {
      await folderService.assignUsersToFolder(folderId, userIds);
      Alert.alert('Éxito', 'Usuarios asignados correctamente');
      setShowAssignModal(false);
      setSelectedFolder(null);
      loadData();
    } catch (error: any) {
      console.error('Error asignando usuarios:', error);
      Alert.alert('Error', 'No se pudieron asignar los usuarios');
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(
      'Eliminar Carpeta',
      `¿Estás seguro de que quieres eliminar la carpeta "${folder.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await folderService.deleteFolder(folder._id);
              Alert.alert('Éxito', 'Carpeta eliminada correctamente');
              loadData();
            } catch (error: any) {
              console.error('Error eliminando carpeta:', error);
              Alert.alert('Error', 'No se pudo eliminar la carpeta');
            }
          }
        }
      ]
    );
  };

  const openAssignModal = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowAssignModal(true);
  };

  const getAssignedUsersNames = (folder: Folder) => {
    if (!folder.usuarios || folder.usuarios.length === 0) {
      return 'Sin usuarios asignados';
    }
    
    const assignedUsers = users.filter(user => 
      folder.usuarios.includes(user._id)
    );
    
    if (assignedUsers.length === 0) {
      return 'Usuarios no encontrados';
    }
    
    return assignedUsers.map(user => 
      `${user.nombres} ${user.apellidos}`
    ).join(', ');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando carpetas...</Text>
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
        <Text style={styles.headerTitle}>📁 Gestión de Carpetas</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{folders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {folders.reduce((total, folder) => total + (folder.files?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Archivos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {folders.reduce((total, folder) => total + (folder.usuarios?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Asignaciones</Text>
        </View>
      </View>

      {/* Lista de carpetas */}
      <ScrollView 
        style={styles.foldersList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
        }
      >
        {folders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📁</Text>
            <Text style={styles.emptyStateTitle}>No hay carpetas</Text>
            <Text style={styles.emptyStateText}>
              Comienza creando la primera carpeta del sistema
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Crear Carpeta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          folders.map((folder) => (
            <View key={folder._id} style={styles.folderCard}>
              <View style={styles.folderInfo}>
                <View style={styles.folderHeader}>
                  <Text style={styles.folderIcon}>📁</Text>
                  <View style={styles.folderDetails}>
                    <Text style={styles.folderName}>{folder.name}</Text>
                    <Text style={styles.folderDescription}>Carpeta de archivos</Text>
                    <Text style={styles.folderDate}>
                      Creada: {new Date(folder.createdAt).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.folderStats}>
                  <Text style={styles.folderStat}>
                    📄 {folder.files?.length || 0} archivos
                  </Text>
                  <Text style={styles.folderStat}>
                    👥 {folder.usuarios?.length || 0} usuarios
                  </Text>
                </View>
                
                <Text style={styles.assignedUsers}>
                  <Text style={styles.assignedUsersLabel}>Usuarios asignados:</Text> {getAssignedUsersNames(folder)}
                </Text>
              </View>
              
              <View style={styles.folderActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.assignButton]}
                  onPress={() => openAssignModal(folder)}
                >
                  <Text style={styles.actionButtonText}>👥</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => Alert.alert('Próximamente', 'Edición de carpetas estará disponible pronto')}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteFolder(folder)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para crear carpeta */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📁 Crear Nueva Carpeta</Text>
            
            <Text style={styles.inputLabel}>Nombre de la carpeta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Documentos Básicos"
              value={newFolder.name}
              onChangeText={(text) => setNewFolder(prev => ({ ...prev, name: text }))}
            />
            
            <Text style={styles.inputLabel}>Descripción</Text>
            <Text style={styles.descriptionText}>
              Esta carpeta se creará para almacenar archivos relacionados con "{newFolder.name}"
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateFolder}
              >
                <Text style={styles.createButtonText}>Crear Carpeta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para asignar usuarios */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              👥 Asignar Usuarios a "{selectedFolder?.name}"
            </Text>
            
            <Text style={styles.modalDescription}>
              Selecciona los usuarios que tendrán acceso a esta carpeta:
            </Text>
            
            <ScrollView style={styles.usersList}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={[
                    styles.userItem,
                    selectedFolder?.usuarios?.includes(user._id) && styles.selectedUser
                  ]}
                  onPress={() => {
                    if (selectedFolder) {
                      const isAssigned = selectedFolder.usuarios?.includes(user._id);
                      const newUsuarios = isAssigned
                        ? selectedFolder.usuarios.filter(id => id !== user._id)
                        : [...(selectedFolder.usuarios || []), user._id];
                      
                      setSelectedFolder({ ...selectedFolder, usuarios: newUsuarios });
                    }
                  }}
                >
                  <Text style={styles.userName}>
                    {user.nombres} {user.apellidos}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userStatus}>
                    {selectedFolder?.usuarios?.includes(user._id) ? '✅ Asignado' : '❌ No asignado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAssignModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.assignButton]}
                onPress={() => {
                  if (selectedFolder) {
                    handleAssignUsers(selectedFolder._id, selectedFolder.usuarios || []);
                  }
                }}
              >
                <Text style={styles.assignButtonText}>Asignar Usuarios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 16,
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
  foldersList: {
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
  folderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  folderInfo: {
    flex: 1,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  folderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  folderDetails: {
    flex: 1,
  },
  folderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  folderDate: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  folderStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  folderStat: {
    fontSize: 14,
    color: '#95a5a6',
    marginRight: 16,
  },
  assignedUsers: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  assignedUsersLabel: {
    fontWeight: '600',
  },
  folderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  assignButton: {
    backgroundColor: '#3498db',
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  createButton: {
    backgroundColor: '#27ae60',
  },
  assignButton: {
    backgroundColor: '#3498db',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  assignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  usersList: {
    maxHeight: 200,
    marginVertical: 16,
  },
  userItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedUser: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
});
