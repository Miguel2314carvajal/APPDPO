import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';

interface File {
  _id: string;
  name: string;
  description: string;
  url: string;
  tipo: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface Folder {
  _id: string;
  name: string;
  files: File[];
  usuarios: string[];
  createdAt: string;
  updatedAt: string;
}

export default function CarpetaDetalle() {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { folderId } = route.params as { folderId: string };

  useEffect(() => {
    loadFolderDetails();
  }, [folderId]);

  const loadFolderDetails = async () => {
    try {
      console.log('🔄 Cargando detalles de carpeta:', folderId);
      setIsLoading(true);
      
      const folderData = await folderService.getFolder(folderId);
      console.log('✅ Carpeta cargada:', folderData.name, 'Archivos:', folderData.files?.length || 0);
      
      setFolder(folderData);
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

  const downloadFile = async (file: File) => {
    try {
      console.log('📥 Intentando abrir archivo:', file.name);
      console.log('🔗 URL del archivo:', file.url);
      
      // Verificar si el archivo tiene URL
      if (!file.url) {
        Alert.alert('Error', 'El archivo no tiene una URL válida');
        return;
      }

      // Mostrar indicador de carga
      Alert.alert(
        'Abriendo archivo',
        `¿Deseas abrir "${file.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir',
            onPress: async () => {
              try {
                // Verificar si la URL es válida
                const supported = await Linking.canOpenURL(file.url);
                
                if (supported) {
                  console.log('✅ URL soportada, abriendo archivo...');
                  await Linking.openURL(file.url);
                } else {
                  console.log('❌ URL no soportada');
                  Alert.alert(
                    'No se puede abrir',
                    `No se puede abrir este tipo de archivo (${file.tipo || 'desconocido'}).\n\nURL: ${file.url}`,
                    [{ text: 'OK' }]
                  );
                }
              } catch (openError) {
                console.error('❌ Error abriendo archivo:', openError);
                Alert.alert(
                  'Error',
                  'No se pudo abrir el archivo. Verifica que tengas una aplicación compatible instalada.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error en downloadFile:', error);
      Alert.alert('Error', 'No se pudo procesar el archivo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    return '📎';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando carpeta...</Text>
      </View>
    );
  }

  if (!folder) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la carpeta</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFolderDetails}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshFolder} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.fileCount}>
            {folder.files?.length || 0} archivos
          </Text>
        </View>
      </View>

      {/* Información de la carpeta */}
      <View style={styles.folderInfo}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📁 Información de la Carpeta</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Creada:</Text> {new Date(folder.createdAt).toLocaleDateString('es-ES')}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Última actualización:</Text> {new Date(folder.updatedAt).toLocaleDateString('es-ES')}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Total de archivos:</Text> {folder.files?.length || 0}
          </Text>
        </View>
      </View>

      {/* Lista de archivos */}
      <View style={styles.filesContainer}>
        <Text style={styles.sectionTitle}>📎 Archivos</Text>
        
        {!folder.files || folder.files.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📎</Text>
            <Text style={styles.emptyStateTitle}>No hay archivos</Text>
            <Text style={styles.emptyStateText}>
              Esta carpeta no contiene archivos aún.
            </Text>
          </View>
        ) : (
          <View style={styles.filesList}>
            {folder.files.map((file) => (
              <TouchableOpacity
                key={file._id}
                style={styles.fileCard}
                onPress={() => downloadFile(file)}
                activeOpacity={0.7}
              >
                <View style={styles.fileIcon}>
                  <Text style={styles.fileIconText}>{getFileIcon(file.mimeType)}</Text>
                </View>
                
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {file.name}
                  </Text>
                  {file.description && (
                    <Text style={styles.fileDescription} numberOfLines={1}>
                      {file.description}
                    </Text>
                  )}
                  <Text style={styles.fileDetails}>
                    {file.tipo} • {formatFileSize(file.size || 0)} • {new Date(file.createdAt).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => downloadFile(file)}
                >
                  <Ionicons name="download" size={20} color="#3498db" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  fileCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  folderInfo: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#7f8c8d',
  },
  filesContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
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
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  fileIconText: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  fileDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: '#95a5a6',
  },
  downloadButton: {
    padding: 8,
  },
});
