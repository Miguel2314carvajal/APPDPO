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
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
        console.log('Archivo seleccionado:', file.name);
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
    console.log('Limpiando formulario');
    setFileData({
      nombre: '',
      descripcion: '',
      carpetaId: '',
      archivo: null
    });
    setSelectedFile(null);
  };

  const openUploadModal = (carpetaId?: string) => {
    console.log('Abriendo modal con carpetaId:', carpetaId);
    // Limpiar archivo seleccionado primero
    setSelectedFile(null);
    
    // Si se proporciona una carpeta específica, la pre-seleccionamos
    if (carpetaId) {
      setFileData({
        nombre: '',
        descripcion: '',
        carpetaId: carpetaId,
        archivo: null
      });
    } else {
      // Si no se proporciona carpeta, limpiamos el formulario
      resetForm();
    }
    setShowUploadModal(true);
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
            <Ionicons name="cloud-upload" size={24} color="#27AE60" />
            <Text style={styles.headerTitle}>Subir Archivos</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="folder" size={20} color="#007AFF" />
            </View>
            <Text style={styles.statNumber}>{folders.length}</Text>
            <Text style={styles.statLabel}>Carpetas</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="document" size={20} color="#34C759" />
            </View>
            <Text style={styles.statNumber}>
              {folders.reduce((total, folder) => total + (folder.files?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Archivos</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="folder-open" size={20} color="#FF9500" />
            </View>
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
                onPress={() => navigation.navigate('Carpetas' as never)}
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
                  </View>
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
                      onPress={() => openUploadModal(folder._id)}
                    >
                      <View style={styles.addMoreButtonContent}>
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addMoreFilesText}>Agregar más archivos</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noFilesContainer}>
                    <Text style={styles.noFilesText}>📄 No hay archivos en esta carpeta</Text>
                    <TouchableOpacity 
                      style={styles.uploadHereButton}
                      onPress={() => openUploadModal(folder._id)}
                    >
                      <View style={styles.uploadHereButtonContent}>
                        <Ionicons name="cloud-upload" size={20} color="white" />
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
          onRequestClose={() => {
            setShowUploadModal(false);
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Ionicons name="cloud-upload" size={24} color="#27ae60" />
                <Text style={styles.modalTitle}>Subir Nuevo Archivo</Text>
              </View>

              {/* Scrollable Content */}
              <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                {/* Seleccionar archivo */}
                <Text style={[styles.inputLabel, styles.firstInputLabel]}>Seleccionar archivo</Text>
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
              </ScrollView>

              {/* Fixed Bottom Actions */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
    marginLeft: 10,
  },
  headerSpacer: {
    width: 48,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    backgroundColor: 'white',
    marginTop: 32,
    marginBottom: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
    textAlign: 'center',
  },
  foldersList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
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
  filesContainer: {
    marginTop: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
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
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  fileDescription: {
    fontSize: 13,
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadHereButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHereText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadHintText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
  },
  addMoreFilesButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addMoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreFilesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    flex: 1,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
  },
  modalScrollContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 20,
  },
  firstInputLabel: {
    marginTop: 0, // Override default marginTop for the first input label
  },
  filePickerButton: {
    backgroundColor: '#3498db',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  filePickerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedFileInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  selectedFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  selectedFileSize: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c3e50',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
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
});
