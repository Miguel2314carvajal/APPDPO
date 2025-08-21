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
  RefreshControl,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RNFS from 'react-native-fs';
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

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('🔐 Solicitando permisos de almacenamiento...');
        
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "📁 Permiso de Almacenamiento",
            message: "Para descargar archivos a tu dispositivo, necesitamos acceso al almacenamiento. Esto te permitirá guardar archivos en tu carpeta de Descargas.",
            buttonNeutral: "Preguntar más tarde",
            buttonNegative: "Cancelar",
            buttonPositive: "Permitir"
          }
        );
        
        console.log('📋 Resultado del permiso:', granted);
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Permisos concedidos');
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          console.log('❌ Permisos denegados');
          Alert.alert(
            'Permisos Denegados',
            'Para descargar archivos, necesitas dar permisos de almacenamiento a la aplicación.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Ir a Configuración',
                onPress: () => {
                  // Intentar abrir la configuración de la app
                  Linking.openSettings().catch(() => {
                    Alert.alert(
                      'Configuración',
                      'Ve a Configuración > Aplicaciones > AuditoriasApp > Permisos > Almacenamiento'
                    );
                  });
                }
              }
            ]
          );
          return false;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('🚫 Permisos bloqueados permanentemente');
          Alert.alert(
            'Permisos Bloqueados',
            'Has bloqueado permanentemente los permisos de almacenamiento. Para descargar archivos, debes habilitarlos manualmente en la configuración.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Ir a Configuración',
                onPress: () => {
                  // Intentar abrir la configuración de la app
                  Linking.openSettings().catch(() => {
                    Alert.alert(
                      'Configuración Manual',
                      'Sigue estos pasos:\n\n1. Ve a Configuración\n2. Aplicaciones\n3. AuditoriasApp\n4. Permisos\n5. Almacenamiento\n6. Activa el interruptor'
                    );
                  });
                }
              }
            ]
          );
          return false;
        } else {
          console.log('⏰ Permisos pospuestos');
          return false;
        }
      } catch (err) {
        console.error('❌ Error solicitando permisos:', err);
        return false;
      }
    }
    return true; // iOS no necesita este permiso
  };

  const downloadFile = async (file: File) => {
    try {
      console.log('📥 Descargando archivo:', file.name);
      console.log('🔗 URL del archivo:', file.url);
      
      // Verificar si el archivo tiene URL
      if (!file.url) {
        Alert.alert('Error', 'El archivo no tiene una URL válida');
        return;
      }

      // Solicitar permisos de almacenamiento
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Error', 'Se requieren permisos de almacenamiento para descargar archivos');
        return;
      }

      // Obtener la extensión del archivo
      const fileExtension = file.name.split('.').pop() || 'pdf';
      const fileName = file.name || `archivo_${Date.now()}.${fileExtension}`;
      
      // Definir la ruta de descarga
      const downloadPath = Platform.OS === 'ios' 
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      console.log('📁 Ruta de descarga:', downloadPath);

      // Mostrar indicador de descarga
      Alert.alert(
        'Descargando archivo',
        `¿Deseas descargar "${file.name}" a tu dispositivo?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descargar',
            onPress: async () => {
              try {
                // Iniciar descarga
                const response = await RNFS.downloadFile({
                  fromUrl: file.url,
                  toFile: downloadPath,
                  background: true,
                  discretionary: true,
                  progress: (res) => {
                    const progressPercent = (res.bytesWritten / res.contentLength) * 100;
                    console.log(`📊 Progreso: ${progressPercent.toFixed(1)}%`);
                  },
                  progressDivider: 1
                }).promise;

                if (response.statusCode === 200) {
                  console.log('✅ Archivo descargado exitosamente');
                  Alert.alert(
                    '¡Descarga completada!',
                    `El archivo "${file.name}" se ha descargado exitosamente a tu dispositivo.`,
                    [
                      {
                        text: 'Abrir archivo',
                        onPress: () => openFile(file)
                      },
                      { text: 'OK' }
                    ]
                  );
                } else {
                  throw new Error(`Error en descarga: ${response.statusCode}`);
                }
              } catch (downloadError) {
                console.error('❌ Error descargando archivo:', downloadError);
                Alert.alert(
                  'Error',
                  'No se pudo descargar el archivo. Verifica tu conexión a internet.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error en downloadFile:', error);
      Alert.alert('Error', 'No se pudo procesar la descarga');
    }
  };

  const openFile = async (file: File) => {
    try {
      console.log('📂 Abriendo archivo:', file.name);
      console.log('🔗 URL del archivo:', file.url);
      
      // Verificar si el archivo tiene URL
      if (!file.url) {
        Alert.alert('Error', 'El archivo no tiene una URL válida');
        return;
      }

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
    } catch (error) {
      console.error('❌ Error abriendo archivo:', error);
      Alert.alert(
        'Error',
        'No se pudo abrir el archivo. Verifica que tengas una aplicación compatible instalada.',
        [{ text: 'OK' }]
      );
    }
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
              <View key={file._id} style={styles.fileCard}>
                <TouchableOpacity
                  style={styles.fileInfoContainer}
                  onPress={() => openFile(file)}
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
                </TouchableOpacity>
                
                <View style={styles.fileActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openFile(file)}
                  >
                    <Ionicons name="eye" size={18} color="#3498db" />
                    <Text style={styles.actionButtonText}>Abrir</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.downloadButton]}
                    onPress={() => downloadFile(file)}
                  >
                    <Ionicons name="download" size={18} color="#27ae60" />
                    <Text style={[styles.actionButtonText, styles.downloadButtonText]}>Descargar</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  downloadButton: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  downloadButtonText: {
    color: '#155724',
  },
});
