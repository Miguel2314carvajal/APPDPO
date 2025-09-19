import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import { CreateNestedFolderData } from '../../types';
import NestedFolderTree from '../../components/NestedFolderTree';
import NestedFolderCreator from '../../components/NestedFolderCreator';
import EditarCarpetaAnidada from '../../components/EditarCarpetaAnidada';
import EliminarCarpetaModal from '../../components/EliminarCarpetaModal';

export default function CarpetasNuevasScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [deletingFolder, setDeletingFolder] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando estructura jerárquica...');
      const foldersData = await folderService.getHierarchicalStructure();
      console.log('📁 Datos recibidos:', foldersData);
      
      // Validar que sea un array
      let foldersArray: any[] = [];
      if (Array.isArray(foldersData)) {
        foldersArray = foldersData;
      } else if (foldersData && Array.isArray((foldersData as any).carpetas)) {
        foldersArray = (foldersData as any).carpetas;
      } else {
        console.warn('⚠️ Formato de datos inesperado:', foldersData);
        foldersArray = [];
      }
      
      // Calcular cantidad de subcarpetas para cada carpeta
      const foldersWithSubfolderCount = await Promise.all(
        foldersArray.map(async (folder) => {
          try {
            // Obtener subcarpetas de esta carpeta
            const subfoldersResponse = await folderService.getSubfolders(folder._id);
            const subfolders = (subfoldersResponse as any).subcarpetas || subfoldersResponse || [];
            
            // Contar subcarpetas recursivamente
            const countSubfoldersRecursively = (subfolders: any[]): number => {
              let count = subfolders.length;
              for (const subfolder of subfolders) {
                if (subfolder.subfolders && subfolder.subfolders.length > 0) {
                  count += countSubfoldersRecursively(subfolder.subfolders);
                }
              }
              return count;
            };
            
            const totalSubfolders = countSubfoldersRecursively(subfolders);
            
            return {
              ...folder,
              subfoldersCount: totalSubfolders,
              subfolders: subfolders // Incluir subcarpetas para el árbol
            };
          } catch (error) {
            console.error('❌ Error cargando subcarpetas para', folder.name, ':', error);
            return {
              ...folder,
              subfoldersCount: 0,
              subfolders: []
            };
          }
        })
      );
      
      console.log('📁 Carpetas con conteo de subcarpetas:', foldersWithSubfolderCount);
      setFolders(foldersWithSubfolderCount);
      setFilteredFolders(foldersWithSubfolderCount);
    } catch (error: any) {
      console.error('❌ Error cargando carpetas:', error);
      setError('No se pudieron cargar las carpetas: ' + error.message);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredFolders(folders);
      return;
    }

    const filtered = folders.filter(folder => 
      folder.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredFolders(filtered);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    setError(null);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCreateFolder = async (folderData: CreateNestedFolderData) => {
    try {
      setIsLoading(true);
      await folderService.createNestedFolder(folderData);
      Alert.alert('✅ Éxito', 'Carpeta creada correctamente');
      setShowCreateModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error creando carpeta:', error);
      Alert.alert('Error', 'No se pudo crear la carpeta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFolder = (folder: any) => {
    console.log('✏️ Editando carpeta:', folder);
    setEditingFolder(folder);
    setShowEditModal(true);
  };

  const handleDeleteFolder = (folder: any) => {
    console.log('🗑️ Eliminando carpeta:', folder);
    setDeletingFolder(folder);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
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
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="folder" size={24} color="#3B82F6" />
            <Text style={styles.headerTitle}>Gestión de Carpetas</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Campo de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar carpetas..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#6B7280"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleSearch('')}
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lista de carpetas */}
        <ScrollView 
          style={styles.foldersList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#FF3B30" />
              <Text style={styles.errorTitle}>Error al cargar carpetas</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadData}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : filteredFolders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open" size={64} color="#8E8E93" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No se encontraron carpetas' : 'No hay carpetas'}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery 
                  ? `No hay carpetas que coincidan con "${searchQuery}"`
                  : 'Crea tu primera carpeta para comenzar a organizar tus archivos'
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.createFirstButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.createFirstButtonText}>Crear Primera Carpeta</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <NestedFolderTree
              folders={filteredFolders}
              onEdit={handleEditFolder}
              onDelete={handleDeleteFolder}
            />
          )}
        </ScrollView>

        {/* Modal para crear carpeta */}
        {showCreateModal && (
          <NestedFolderCreator
            onSuccess={() => {
              setShowCreateModal(false);
              loadData();
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        )}

        {/* Modal para editar carpeta */}
        {showEditModal && editingFolder && (
          <EditarCarpetaAnidada
            folder={editingFolder}
            onClose={() => {
              setShowEditModal(false);
              setEditingFolder(null);
            }}
            onUpdate={() => {
              setShowEditModal(false);
              setEditingFolder(null);
              loadData();
            }}
          />
        )}

        {/* Modal para eliminar carpeta */}
        {showDeleteModal && deletingFolder && (
          <EliminarCarpetaModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeletingFolder(null);
            }}
            folder={deletingFolder}
            onEliminacionCompleta={() => {
              setShowDeleteModal(false);
              setDeletingFolder(null);
              loadData();
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F9FAFB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 10,
    padding: 2,
  },
  foldersList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
