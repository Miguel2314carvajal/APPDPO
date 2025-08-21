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
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';
import * as DocumentPicker from 'expo-document-picker';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
}

interface FileData {
  nombre: string;
  descripcion: string;
  carpetaId: string;
  archivo: any;
}

export default function SubirArchivoScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
  // Formulario de archivo
  const [fileData, setFileData] = useState<FileData>({
    nombre: '',
    descripcion: '',
    carpetaId: '',
    archivo: null
  });

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const foldersData = await folderService.listFolders();
      setFolders(foldersData);
    } catch (error: any) {
      console.error('Error cargando carpetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFolders = async () => {
    setIsRefreshing(true);
    await loadFolders();
    setIsRefreshing(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile(file);
        setFileData(prev => ({
          ...prev,
          nombre: file.name || 'Archivo sin nombre',
          archivo: file
        }));
        
        // Auto-descripción basada en el tipo de archivo
        const fileExtension = file.name?.split('.').pop()?.toLowerCase();
        let autoDescription = '';
        
        switch (fileExtension) {
          case 'pdf':
            autoDescription = 'Documento PDF';
            break;
          case 'doc':
          case 'docx':
            autoDescription = 'Documento de Word';
            break;
          case 'xls':
          case 'xlsx':
            autoDescription = 'Hoja de cálculo Excel';
            break;
          case 'ppt':
          case 'pptx':
            autoDescription = 'Presentación PowerPoint';
            break;
          case 'jpg':
          case 'jpeg':
          case 'png':
            autoDescription = 'Imagen';
            break;
          case 'txt':
            autoDescription = 'Archivo de texto';
            break;
          default:
            autoDescription = `Archivo ${fileExtension?.toUpperCase() || 'desconocido'}`;
        }
        
        setFileData(prev => ({
          ...prev,
          descripcion: autoDescription
        }));
      }
    } catch (error) {
      console.error('Error seleccionando archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleUpload = async () => {
    if (!fileData.nombre.trim() || !fileData.descripcion.trim() || !fileData.carpetaId || !selectedFile) {
      Alert.alert('Error', 'Por favor completa todos los campos y selecciona un archivo');
      return;
    }

    try {
      setIsUploading(true);
      
      // Subir archivo usando el servicio
      await fileService.uploadFile({
        nombre: fileData.nombre,
        descripcion: fileData.descripcion,
        carpetaId: fileData.carpetaId,
        archivo: selectedFile
      });
      
      Alert.alert('Éxito', 'Archivo subido correctamente');
      setShowUploadModal(false);
      resetForm();
      loadFolders(); // Recargar para mostrar el nuevo archivo
    } catch (error: any) {
      console.error('Error subiendo archivo:', error);
      Alert.alert('Error', 'No se pudo subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFileData({
      nombre: '',
      descripcion: '',
      carpetaId: '',
      archivo: null
    });
    setSelectedFile(null);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
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
        <Text style={styles.headerTitle}>📤 Subir Archivos</Text>
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={() => setShowUploadModal(true)}
        >
          <Text style={styles.uploadButtonText}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{folders.length}</Text>
          <Text style={styles.statLabel}>Carpetas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {folders.reduce((total, folder) => total + (folder.files?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Archivos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {folders.filter(f => f.files && f.files.length > 0).length}
          </Text>
          <Text style={styles.statLabel}>Con Archivos</Text>
        </View>
      </View>

      {/* Lista de carpetas con archivos */}
      <ScrollView 
        style={styles.foldersList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshFolders} />
        }
      >
        {folders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📁</Text>
            <Text style={styles.emptyStateTitle}>No hay carpetas</Text>
            <Text style={styles.emptyStateText}>
              Primero crea carpetas para poder subir archivos
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Carpetas')}
            >
              <Text style={styles.emptyStateButtonText}>Gestionar Carpetas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          folders.map((folder) => (
            <View key={folder._id} style={styles.folderCard}>
              <View style={styles.folderHeader}>
                <Text style={styles.folderIcon}>📁</Text>
                <View style={styles.folderInfo}>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.folderDescription}>{folder.name}</Text>
                  <Text style={styles.folderStats}>
                    📄 {folder.files?.length || 0} archivos
                  </Text>
                  <Text style={styles.folderUploadHint}>
                    💡 Puedes subir múltiples archivos aquí
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.uploadToFolderButton}
                  onPress={() => {
                    setFileData(prev => ({ ...prev, carpetaId: folder._id }));
                    setShowUploadModal(true);
                  }}
                >
                  <View style={styles.uploadButtonContent}>
                    <Text style={styles.uploadToFolderText}>📤</Text>
                    <Text style={styles.uploadButtonLabel}>Subir</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Archivos en la carpeta */}
              {folder.files && folder.files.length > 0 ? (
                <View style={styles.filesContainer}>
                  <Text style={styles.filesTitle}>Archivos en esta carpeta:</Text>
                  {folder.files.map((file: any, index: number) => (
                    <View key={index} style={styles.fileItem}>
                      <Text style={styles.fileIcon}>
                        {getFileIcon(file.nombre || file.originalName)}
                      </Text>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName}>
                          {file.nombre || file.originalName || 'Archivo sin nombre'}
                        </Text>
                        <Text style={styles.fileDescription}>
                          {file.descripcion || 'Sin descripción'}
                        </Text>
                        <Text style={styles.fileDetails}>
                          {file.size ? formatFileSize(file.size) : ''} • 
                          {new Date(file.createdAt || file.uploadDate).toLocaleDateString('es-ES')}
                        </Text>
                      </View>
                    </View>
                  ))}
                  
                  {/* Botón para agregar más archivos */}
                  <TouchableOpacity 
                    style={styles.addMoreFilesButton}
                    onPress={() => {
                      setFileData(prev => ({ ...prev, carpetaId: folder._id }));
                      setShowUploadModal(true);
                    }}
                  >
                    <View style={styles.addMoreButtonContent}>
                      <Text style={styles.addMoreIcon}>➕</Text>
                      <Text style={styles.addMoreFilesText}>Agregar más archivos</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noFilesContainer}>
                  <Text style={styles.noFilesText}>📄 No hay archivos en esta carpeta</Text>
                  <TouchableOpacity 
                    style={styles.uploadHereButton}
                    onPress={() => {
                      setFileData(prev => ({ ...prev, carpetaId: folder._id }));
                      setShowUploadModal(true);
                    }}
                  >
                    <View style={styles.uploadHereButtonContent}>
                      <Text style={styles.uploadHereIcon}>📤</Text>
                      <Text style={styles.uploadHereText}>Subir primer archivo</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.uploadHintText}>
                    💡 Después podrás agregar más archivos aquí
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para subir archivo */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📤 Subir Nuevo Archivo</Text>
            
            {/* Información importante */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 <Text style={styles.infoBold}>Puedes subir múltiples archivos</Text> a la misma carpeta.{'\n'}
                Cada archivo se guardará por separado y podrás acceder a todos.
              </Text>
            </View>
            
            {/* Seleccionar carpeta */}
            <Text style={styles.inputLabel}>Seleccionar carpeta</Text>
            <View style={styles.folderSelector}>
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder._id}
                  style={[
                    styles.folderOption,
                    fileData.carpetaId === folder._id && styles.selectedFolder
                  ]}
                  onPress={() => setFileData(prev => ({ ...prev, carpetaId: folder._id }))}
                >
                  <Text style={styles.folderOptionIcon}>📁</Text>
                  <Text style={styles.folderOptionName}>{folder.name}</Text>
                  <Text style={styles.folderOptionStatus}>
                    {fileData.carpetaId === folder._id ? '✅ Seleccionada' : '❌ No seleccionada'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Seleccionar archivo */}
            <Text style={styles.inputLabel}>Seleccionar archivo</Text>
            <TouchableOpacity 
              style={styles.filePickerButton}
              onPress={pickDocument}
            >
              <Text style={styles.filePickerText}>
                {selectedFile ? '📎 Cambiar archivo' : '📎 Seleccionar archivo'}
              </Text>
            </TouchableOpacity>
            
            {selectedFile && (
              <View style={styles.selectedFileInfo}>
                <Text style={styles.selectedFileName}>
                  📎 {selectedFile.name || 'Archivo seleccionado'}
                </Text>
                <Text style={styles.selectedFileSize}>
                  Tamaño: {formatFileSize(selectedFile.size || 0)}
                </Text>
                <Text style={styles.selectedFileType}>
                  Tipo: {selectedFile.mimeType || 'Desconocido'}
                </Text>
              </View>
            )}
            
            {/* Nombre del archivo */}
            <Text style={styles.inputLabel}>Nombre del archivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre personalizado del archivo"
              value={fileData.nombre}
              onChangeText={(text) => setFileData(prev => ({ ...prev, nombre: text }))}
            />
            
            {/* Descripción */}
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe el contenido del archivo..."
              value={fileData.descripcion}
              onChangeText={(text) => setFileData(prev => ({ ...prev, descripcion: text }))}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.uploadButton]}
                onPress={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.uploadButtonText}>Subir Archivo</Text>
                )}
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
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 20,
    color: 'white',
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
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  folderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  folderInfo: {
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
  folderStats: {
    fontSize: 14,
    color: '#95a5a6',
  },
  folderUploadHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadToFolderButton: {
    padding: 8,
    backgroundColor: '#27ae60',
    borderRadius: 8,
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadToFolderText: {
    fontSize: 20,
    color: 'white',
    marginRight: 8,
  },
  uploadButtonLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  filesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  filesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
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
  noFilesContainer: {
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  noFilesText: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 12,
  },
  uploadHereButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadHereButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHereIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  uploadHereText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadHintText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
  },
  addMoreFilesButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#2980b9',
  },
  addMoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addMoreFilesText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
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
    maxHeight: '90%',
    width: '95%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  folderSelector: {
    maxHeight: 150,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFolder: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  folderOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  folderOptionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  folderOptionStatus: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
  },
  filePickerButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filePickerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedFileInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  selectedFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  selectedFileType: {
    fontSize: 14,
    color: '#7f8c8d',
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
  uploadButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e0f2f7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  infoText: {
    fontSize: 14,
    color: '#343a40',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
  },
});
