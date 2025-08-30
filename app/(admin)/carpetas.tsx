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
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  createdAt: string;
}

export default function CarpetasScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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
      const foldersData = await folderService.listFolders();
      setFolders(foldersData);
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

  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(
      'Eliminar Carpeta',
      `¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"?`,
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando carpetas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="folder" size={24} color="#FFD700" />
            <Text style={styles.headerTitle}>Gestión de Carpetas</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>



        {/* Lista de carpetas */}
        <ScrollView 
          style={styles.foldersList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
          }
          showsVerticalScrollIndicator={false}
        >
          {folders.map((folder) => (
            <View key={folder._id} style={styles.folderCard}>
              <View style={styles.folderHeader}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderDescription}>Carpeta de archivos</Text>
              </View>
              
              <View style={styles.folderInfo}>
                <View style={styles.folderDateContainer}>
                  <Ionicons name="calendar" size={16} color="#95a5a6" />
                  <Text style={styles.folderDate}>
                    Creada: {new Date(folder.createdAt).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <View style={styles.folderStatsRow}>
                  <View style={styles.folderStats}>
                    <View style={styles.folderStat}>
                      <Ionicons name="document" size={16} color="#95a5a6" />
                      <Text style={styles.folderStatText}>
                        {folder.files?.length || 0} archivos
                      </Text>
                    </View>
                    <View style={styles.folderStat}>
                      <Ionicons name="people" size={16} color="#95a5a6" />
                      <Text style={styles.folderStatText}>
                        {folder.usuarios?.length || 0} usuarios
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.folderActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => Alert.alert('Próximamente', 'Edición de carpetas estará disponible pronto')}
                    >
                      <Ionicons name="create" size={18} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteFolder(folder)}
                    >
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
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
              <View style={styles.modalHeader}>
                <Ionicons name="folder" size={24} color="#007AFF" />
                <Text style={styles.modalTitle}>Crear Nueva Carpeta</Text>
              </View>
              
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },

  foldersList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  folderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  folderHeader: {
    marginBottom: 16,
  },
  folderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  folderDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  folderInfo: {
    marginBottom: 16,
  },
  folderDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  folderDate: {
    fontSize: 14,
    color: '#95a5a6',
    marginLeft: 8,
    fontWeight: '500',
  },
  folderStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  folderStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderStatText: {
    fontSize: 14,
    color: '#95a5a6',
    marginLeft: 8,
    fontWeight: '500',
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 28,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  createButton: {
    backgroundColor: '#27ae60',
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
  descriptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
