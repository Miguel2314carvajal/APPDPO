import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  subfolders?: Folder[];
  parentFolder?: string | null;
}

export default function CarpetaDetalleScreen() {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
  // Formulario de archivo
  const [fileData, setFileData] = useState({
    nombre: '',
    descripcion: '',
    archivo: null,
  });

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    loadFolder();
  }, []);

  const loadFolder = async () => {
    try {
      setIsLoading(true);
      const { folderId } = route.params as any;
      console.log('📁 Cargando carpeta:', folderId);
      
      // Cargar datos de la carpeta
      const folderData = await folderService.getFolder(folderId);
      console.log('📁 Carpeta cargada:', folderData);
      
      // Cargar todas las carpetas para encontrar subcarpetas
      const allFolders = await folderService.listFolders();
      const folderList = (allFolders as any).carpetas || allFolders;
      
      // Filtrar subcarpetas de esta carpeta
      const subfoldersData = folderList.filter((f: any) => f.parentFolder?._id === folderId);
      console.log('📁 Subcarpetas encontradas:', subfoldersData);
      
      // Verificar que las subcarpetas tengan IDs y sean válidas
      const validSubfolders = subfoldersData.filter((f: any) => {
        const hasId = f._id && f._id.trim() !== '';
        const hasName = f.name && f.name.trim() !== '';
        const hasParentFolder = f.parentFolder && f.parentFolder._id === folderId;
        console.log('🔍 Validando subcarpeta:', {
          name: f.name,
          id: f._id,
          parentId: f.parentFolder?._id,
          targetId: folderId,
          hasId,
          hasName,
          hasParentFolder,
          valid: hasId && hasName && hasParentFolder
        });
        return hasId && hasName && hasParentFolder;
      });
      console.log('📁 Subcarpetas válidas (con ID y nombre):', validSubfolders);
      
      // Los archivos ya vienen en folderData.files
      const files = folderData.files || [];
      console.log('📁 Archivos encontrados:', files);
      
      setFolder({
        ...folderData,
        subfolders: validSubfolders,
        files: files
      });
    } catch (error: any) {
      console.error('❌ Error cargando carpeta:', error);
      Alert.alert('Error', 'No se pudo cargar la carpeta: ' + (error.response?.data?.msg || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFolder = async () => {
    setIsRefreshing(true);
    await loadFolder();
    setIsRefreshing(false);
  };

  const handleFolderPress = (subfolder: Folder) => {
    console.log('🔄 Navegando a subcarpeta:', subfolder.name, subfolder._id);
    
    // Verificar que la subcarpeta tenga ID y nombre
    if (!subfolder._id || !subfolder.name) {
      console.error('❌ Subcarpeta inválida:', subfolder);
      Alert.alert('Error', 'No se puede navegar a esta subcarpeta');
      return;
    }
    
    // Verificar que el ID no esté vacío
    if (subfolder._id.trim() === '') {
      console.error('❌ Subcarpeta con ID vacío:', subfolder);
      Alert.alert('Error', 'No se puede navegar a esta subcarpeta');
      return;
    }
    
    console.log('✅ Navegando a subcarpeta válida:', subfolder.name, subfolder._id);
    
    // Navegar a la subcarpeta con un pequeño delay para asegurar que la navegación funcione
    setTimeout(() => {
      (navigation as any).navigate('CarpetaDetalleAdmin', { 
        folderId: subfolder._id, 
        folderName: subfolder.name 
      });
    }, 100);
  };

  const handleUploadPress = () => {
    if (!folder) return;
    
    // Navegar a subir archivo con la carpeta pre-seleccionada
    (navigation as any).navigate('SubirArchivo', { 
      folderId: folder._id, 
      folderName: folder.name 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando carpeta...</Text>
      </View>
    );
  }

  if (!folder) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Carpeta no encontrada</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadFolder}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
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
            <Ionicons name="folder" size={24} color="#FF9500" />
            <Text style={styles.headerTitle}>{folder.name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUploadPress}
          >
            <Ionicons name="cloud-upload" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshFolder} />
          }
        >
          {/* Subcarpetas */}
          {folder.subfolders && folder.subfolders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subcarpetas ({folder.subfolders.length})</Text>
              {folder.subfolders.map((subfolder) => (
                <TouchableOpacity
                  key={subfolder._id}
                  style={styles.folderCard}
                  onPress={() => handleFolderPress(subfolder)}
                >
                  <View style={styles.folderInfo}>
                    <Ionicons name="folder" size={24} color="#FF9500" />
                    <View style={styles.folderDetails}>
                      <Text style={styles.folderName}>{subfolder.name}</Text>
                      <Text style={styles.folderMeta}>
                        {subfolder.files?.length || 0} archivos • {subfolder.subfolders?.length || 0} subcarpetas
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Archivos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Archivos ({folder.files?.length || 0})</Text>
            {folder.files && folder.files.length > 0 ? (
              folder.files.map((file) => (
                <View key={file._id} style={styles.fileCard}>
                  <View style={styles.fileInfo}>
                    <Ionicons name="document" size={24} color="#3B82F6" />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileMeta}>
                        {formatFileSize(file.size || 0)} • {new Date(file.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.downloadButton}>
                    <Ionicons name="download" size={20} color="#10B981" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📄</Text>
                <Text style={styles.emptyStateTitle}>No hay archivos</Text>
                <Text style={styles.emptyStateText}>
                  Sube archivos usando el botón de arriba
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  uploadButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  folderMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  downloadButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
