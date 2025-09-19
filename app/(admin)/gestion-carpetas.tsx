import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { folderService } from '../../services/folderService';
import NestedFolderTree from '../../components/NestedFolderTree';
import NestedFolderCreator from '../../components/NestedFolderCreator';

export default function GestionCarpetasScreen() {
  const navigation = useNavigation();
  const [folders, setFolders] = useState<any[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📁 Cargando carpetas...');
      
      const data = await folderService.getHierarchicalStructure();
      console.log('✅ Carpetas cargadas:', data);
      
      let foldersData: any[] = [];
      if (Array.isArray(data)) {
        foldersData = data;
      } else if (data && Array.isArray((data as any).carpetas)) {
        foldersData = (data as any).carpetas;
      } else {
        console.warn('⚠️ Formato de datos inesperado:', data);
        foldersData = [];
      }
      
      setFolders(foldersData);
      setFilteredFolders(foldersData);
    } catch (err: any) {
      console.error('❌ Error cargando carpetas:', err);
      setError('Error al cargar las carpetas: ' + (err.response?.data?.msg || err.message));
      setFolders([]);
      setFilteredFolders([]);
    } finally {
      setLoading(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFolders();
    setRefreshing(false);
  };

  const handleCreateFolder = () => {
    setShowCreator(true);
  };

  const handleFolderCreated = () => {
    setShowCreator(false);
    loadFolders();
  };

  const handleCancel = () => {
    setShowCreator(false);
  };

  const handleFolderSelect = (folder: any) => {
    console.log('📁 Carpeta seleccionada:', folder);
    // Navegar a la pantalla de detalle de carpeta
    (navigation as any).navigate('CarpetaDetalleAdmin', { 
      folderId: folder._id, 
      folderName: folder.name 
    });
  };

  const handleEditFolder = (folder: any) => {
    console.log('✏️ Editando carpeta:', folder);
    // Navegar a la pantalla de edición de carpeta
    (navigation as any).navigate('EditarCarpeta', { 
      folderId: folder._id, 
      folderName: folder.name 
    });
  };

  const handleDeleteFolder = (folder: any) => {
    console.log('🗑️ Eliminando carpeta:', folder);
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
              setLoading(true);
              await folderService.deleteFolder(folder._id);
              Alert.alert('Éxito', 'Carpeta eliminada correctamente');
              loadFolders(); // Recargar la lista
            } catch (error: any) {
              console.error('Error eliminando carpeta:', error);
              Alert.alert('Error', 'Error al eliminar la carpeta: ' + (error.response?.data?.msg || error.message));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadFolders();
  }, []);

  if (showCreator) {
    return (
      <SafeAreaView style={styles.container}>
        <NestedFolderCreator
          onSuccess={handleFolderCreated}
          onCancel={handleCancel}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="folder" size={24} color="#007AFF" />
          <Text style={styles.title}>Gestión de Carpetas</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateFolder}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Campo de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#007AFF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Buscar carpetas..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#6c757d"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Ionicons name="close-circle" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando carpetas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#e74c3c" />
            <Text style={styles.errorTitle}>Error al cargar carpetas</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadFolders}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredFolders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open" size={64} color="#95a5a6" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No se encontraron carpetas' : 'No hay carpetas'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `No hay carpetas que coincidan con "${searchQuery}"`
                : 'Comienza creando tu primera carpeta anidada'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={handleCreateFolder}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createFirstButtonText}>Crear Primera Carpeta</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.foldersContainer}>
            <NestedFolderTree
              folders={filteredFolders}
              onEdit={handleEditFolder}
              onDelete={handleDeleteFolder}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#28a745',
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
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: '#2c3e50',
    paddingVertical: 8,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
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
  foldersContainer: {
    flex: 1,
  },
});