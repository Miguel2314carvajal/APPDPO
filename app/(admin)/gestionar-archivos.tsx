import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

interface File {
  _id: string;
  name: string;
  description: string;
  url: string;
  tipo: string;
  size: number;
  mimeType: string;
  createdAt: string;
  clienteDestinatario: {
    _id: string;
    email: string;
    companyName: string;
  };
}

interface Folder {
  _id: string;
  name: string;
  files: File[];
  parentFolder?: string | null | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export default function GestionarArchivosScreen() {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // Estado para el buscador de archivos

  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuth();
  const { folderId, folderName, isMainFolder } = route.params as { 
    folderId: string; 
    folderName?: string; 
    isMainFolder?: boolean; 
  };

  useEffect(() => {
    loadFolderDetails();
  }, [folderId]);

  // Recargar automáticamente cuando la pantalla vuelva a tener foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 Pantalla enfocada, recargando datos...');
      loadFolderDetails();
    }, [folderId])
  );

  const loadFolderDetails = async () => {
    try {
      console.log('🔄 Cargando detalles de carpeta:', folderId);
      setIsLoading(true);
      
      const folderData = await folderService.getFolder(folderId);
      console.log('✅ Carpeta cargada:', folderData.name, 'Archivos:', folderData.files?.length || 0);
      
      setFolder(folderData);
      
      // Si es una carpeta principal, cargar sus subcarpetas
      if (isMainFolder) {
        console.log('📁 Cargando subcarpetas para:', folderData.name);
        const allFolders = await folderService.listFolders();
        const subfoldersData = allFolders.filter((f: any) => {
          const parentId = typeof f.parentFolder === 'string' 
            ? f.parentFolder 
            : f.parentFolder?._id;
          return parentId === folderId;
        });
        console.log('📂 Subcarpetas encontradas:', subfoldersData.length);
        setSubfolders(subfoldersData);
      }
    } catch (error) {
      console.error('❌ Error cargando carpeta:', error);
      Alert.alert('Error', 'No se pudo cargar la carpeta');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFolder = async () => {
    setIsRefreshing(true);
    await loadFolderDetails();
    setIsRefreshing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'document-text';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'videocam';
    if (mimeType.includes('audio')) return 'musical-notes';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'grid';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'easel';
    return 'document';
  };

  const handleDeleteFile = async (file: File) => {
    Alert.alert(
      'Eliminar Archivo',
      `¿Estás seguro de que quieres eliminar "${file.name}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(file._id);
              await fileService.deleteFile(file._id);
              Alert.alert('Éxito', 'Archivo eliminado correctamente');
              await loadFolderDetails(); // Recargar la lista
            } catch (error: any) {
              console.error('Error eliminando archivo:', error);
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
  };

  const openSubfolder = (subfolder: Folder) => {
    (navigation as any).navigate('GestionarArchivos', {
      folderId: subfolder._id,
      folderName: subfolder.name,
      isMainFolder: false
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando archivos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!folder) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>No se pudo cargar la carpeta</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gestionar Archivos</Text>
          <Text style={styles.headerSubtitle}>{folder.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => {
            console.log('🚀 Navegando a SubirArchivo con parámetros:', {
              folderId: folder._id,
              folderName: folder.name,
              isMainFolder: isMainFolder
            });
            (navigation as any).navigate('SubirArchivo', {
              folderId: folder._id,
              folderName: folder.name,
              isMainFolder: isMainFolder
            });
          }}
        >
          <Ionicons name="cloud-upload" size={20} color="white" />
          <Text style={styles.uploadButtonText}>Subir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshFolder} />
        }
      >
        {/* Información de la carpeta */}
        <View style={styles.folderInfo}>
          <View style={styles.folderHeader}>
            <Ionicons name="folder" size={24} color="#007AFF" />
            <Text style={styles.folderName}>{folder.name}</Text>
          </View>
          <Text style={styles.folderDescription}>
            {isMainFolder ? 'Carpeta Principal' : 'Subcarpeta'}
          </Text>
          <Text style={styles.folderStats}>
            📄 {folder.files?.length || 0} archivos
          </Text>
        </View>

        {/* Subcarpetas (solo si es carpeta principal) */}
        {isMainFolder && subfolders.length > 0 && (
          <View style={styles.subfoldersContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder-open" size={20} color="#34C759" />
              <Text style={styles.sectionTitle}>Subcarpetas</Text>
            </View>
            
            <View style={styles.subfoldersList}>
              {subfolders.map((subfolder) => (
                <TouchableOpacity
                  key={subfolder._id}
                  style={styles.subfolderCard}
                  onPress={() => openSubfolder(subfolder)}
                >
                  <View style={styles.subfolderInfo}>
                    <Ionicons name="folder" size={20} color="#34C759" />
                    <Text style={styles.subfolderName}>{subfolder.name}</Text>
                    <Text style={styles.subfolderStats}>
                      {subfolder.files?.length || 0} archivos
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Lista de archivos */}
        <View style={styles.filesContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="attach" size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Archivos</Text>
          </View>
          
          {/* Buscador de archivos */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#95a5a6" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#95a5a6"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#95a5a6" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {!folder.files || folder.files.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No hay archivos</Text>
              <Text style={styles.emptyStateText}>
                Esta carpeta no contiene archivos aún.
              </Text>
            </View>
          ) : (
            <View style={styles.filesList}>
              {folder.files
                .filter(file => 
                  file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  file.clienteDestinatario?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((file) => (
                <View key={file._id} style={styles.fileCard}>
                  <View style={styles.fileInfoContainer}>
                    <View style={styles.fileIcon}>
                      <Ionicons name={getFileIcon(file.mimeType)} size={24} color="#007AFF" />
                    </View>
                    
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      {file.description && (
                        <Text style={styles.fileDescription} numberOfLines={1}>
                          {file.description}
                        </Text>
                      )}
                      <Text style={styles.fileDetails}>
                        {file.tipo} • {formatFileSize(file.size || 0)} • {new Date(file.createdAt).toLocaleDateString('es-ES')}
                      </Text>
                      <Text style={styles.fileClient}>
                        👤 Cliente: {file.clienteDestinatario?.companyName || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.fileActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteFile(file)}
                      disabled={isDeleting === file._id}
                    >
                      {isDeleting === file._id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="trash" size={18} color="white" />
                          <Text style={styles.deleteButtonText}>Eliminar</Text>
                        </>
                      )}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Más espacio desde arriba
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  folderInfo: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  folderName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  folderDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  folderStats: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  subfoldersContainer: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  subfoldersList: {
    gap: 8,
  },
  subfolderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subfolderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subfolderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  subfolderStats: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  filesContainer: {
    margin: 20,
    marginTop: 0,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  filesList: {
    gap: 12,
  },
  fileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  fileInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  fileDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  fileClient: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Estilos para el buscador de archivos
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    color: '#2c3e50',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 10,
    padding: 2,
  },
});
