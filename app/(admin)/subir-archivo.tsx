import React, { useState, useEffect, useCallback } from 'react';
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
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';
import * as DocumentPicker from 'expo-document-picker';

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
  parentFolder?: string | null | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface FileData {
  nombre: string;
  descripcion: string;
  carpetaId: string;
  archivo: any;
}

export default function SubirArchivoScreen() {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasProcessedParams, setHasProcessedParams] = useState(false);
  
  // Formulario de archivo
  const [fileData, setFileData] = useState<FileData>({
    nombre: '',
    descripcion: '',
    carpetaId: '',
    archivo: null
  });

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as any;
  const folderId = routeParams?.folderId;
  const folderName = routeParams?.folderName;
  const isMainFolder = routeParams?.isMainFolder;
  const parentFolderId = routeParams?.parentFolderId;
  const parentFolderName = routeParams?.parentFolderName;

  useEffect(() => {
    if (folderId) {
      loadFolderDetails();
    } else {
      loadMainFolders();
    }
  }, [folderId]);

  // Resetear estado cuando se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      setHasProcessedParams(false);
    }, [])
  );

  // Detectar si viene desde otra pantalla con carpeta pre-seleccionada
  useEffect(() => {
    if (routeParams && !hasProcessedParams) {
      const { selectedFolderId, selectedFolderName, folderId: paramFolderId, folderName: paramFolderName } = routeParams;
      
      // Si viene navegando a una subcarpeta
      if (selectedFolderId && selectedFolderName) {
        console.log('🔄 Navegando a subcarpeta:', selectedFolderName, selectedFolderId);
        loadFolderDetails(selectedFolderId, selectedFolderName);
        setHasProcessedParams(true);
      }
      // Si viene con carpeta pre-seleccionada para subir archivo
      else if (paramFolderId && paramFolderName) {
        // Solo abrir modal si viene específicamente para subir archivo
        // (esto se maneja desde otras pantallas que llamen a openUploadModal)
        setHasProcessedParams(true);
      }
    }
  }, [routeParams, hasProcessedParams]);

  // Manejar el botón físico de atrás del celular
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        console.log('🔄 Botón físico de atrás presionado desde:', folderName);
        console.log('📁 Carpeta padre (parámetros):', parentFolderName, parentFolderId);
        console.log('📁 Carpeta actual:', folder);
        
        // Intentar obtener la carpeta padre de los parámetros o de la carpeta actual
        let targetParentId = parentFolderId;
        let targetParentName = parentFolderName;
        
        if (!targetParentId && folder?.parentFolder) {
          targetParentId = typeof folder.parentFolder === 'string' 
            ? folder.parentFolder 
            : (folder.parentFolder as any)._id;
          targetParentName = typeof folder.parentFolder === 'string' 
            ? 'Carpeta Padre' 
            : (folder.parentFolder as any).name;
          console.log('📁 Carpeta padre (de carpeta actual):', targetParentName, targetParentId);
        }
        
        if (targetParentId && targetParentName) {
          // Navegar a la carpeta padre
          console.log('🔄 Navegando a carpeta padre:', targetParentName, targetParentId);
          (navigation as any).navigate('SubirArchivo', {
            folderId: targetParentId,
            folderName: targetParentName,
            isMainFolder: true
          });
        } else {
          // Si no hay carpeta padre, ir al dashboard
          console.log('🔄 Navegando al dashboard');
          (navigation as any).navigate('AdminDashboard');
        }
        
        return true; // Prevenir el comportamiento por defecto
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [folder, parentFolderId, parentFolderName, folderName, navigation])
  );

  const loadMainFolders = async () => {
    try {
      console.log('📁 Cargando carpetas principales...');
      setIsLoading(true);
      
      const response = await folderService.listFolders();
      const foldersData = (response as any).carpetas || response;
      console.log('📁 Carpetas cargadas:', foldersData);
      
      // Mostrar solo carpetas principales
      const mainFolders = foldersData.filter((folder: any) => !folder.parentFolder);
      console.log('📁 Carpetas principales:', mainFolders);
      
      // Calcular total de archivos para cada carpeta
      const foldersWithCounts = await Promise.all(
        mainFolders.map(async (folder: any) => {
          let totalFiles = folder.files?.length || 0;
          
          // Encontrar subcarpetas de esta carpeta
          const subfolders = foldersData.filter((f: any) => f.parentFolder?._id === folder._id);
          
          // Sumar archivos de subcarpetas recursivamente
          const countFilesRecursively = (subfolders: any[]): number => {
            let count = 0;
            for (const subfolder of subfolders) {
              count += subfolder.files?.length || 0;
              // Buscar subcarpetas de esta subcarpeta
              const nestedSubfolders = foldersData.filter((f: any) => f.parentFolder?._id === subfolder._id);
              count += countFilesRecursively(nestedSubfolders);
            }
            return count;
          };
          
          totalFiles += countFilesRecursively(subfolders);
          
          return {
            ...folder,
            totalFiles: totalFiles,
            subfolders: subfolders // Agregar subcarpetas para mostrar el contador
          };
        })
      );
      
      setSubfolders(foldersWithCounts);
      setFolder(null); // Asegurar que no hay carpeta seleccionada
    } catch (error: any) {
      console.error('❌ Error cargando carpetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas: ' + (error.response?.data?.msg || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolderDetails = async (targetFolderId?: string, targetFolderName?: string) => {
    try {
      const currentFolderId = targetFolderId || folderId;
      const currentFolderName = targetFolderName || folderName;
      
      if (!currentFolderId) {
        console.log('❌ No hay folderId para cargar detalles');
        return;
      }
      
      console.log('🔄 Cargando detalles de carpeta:', currentFolderId);
      setIsLoading(true);
      
      const folderData = await folderService.getFolder(currentFolderId);
      console.log('✅ Carpeta cargada:', folderData.name, 'Archivos:', folderData.files?.length || 0);
      
      setFolder(folderData as any);
      
      // Cargar subcarpetas siempre (puede ser carpeta principal o subcarpeta)
      console.log('📁 Cargando subcarpetas para:', folderData.name);
      try {
        // Usar el endpoint directo para subcarpetas
        const subfoldersResponse = await folderService.getSubfolders(currentFolderId);
        console.log('📁 Respuesta de subcarpetas:', subfoldersResponse);
        
        // El backend devuelve { subcarpetas: [...] }, extraer el array
        const subfolders = (subfoldersResponse as any).subcarpetas || subfoldersResponse || [];
        console.log('📂 Subcarpetas encontradas:', subfolders.length);
        setSubfolders(subfolders as any);
        
        // Calcular total de archivos incluyendo subcarpetas
        let totalFiles = folderData.files?.length || 0;
        console.log('📊 Archivos en carpeta principal:', totalFiles);
        
        // Función recursiva para contar archivos en subcarpetas
        const countFilesRecursively = async (subfolders: any[]): Promise<number> => {
          let count = 0;
          for (const subfolder of subfolders) {
            try {
              // Cargar archivos de cada subcarpeta
              const subfolderData = await folderService.getFolder(subfolder._id);
              const subfolderFiles = subfolderData.files?.length || 0;
              console.log('📁 Archivos en subcarpeta', subfolder.name, ':', subfolderFiles);
              count += subfolderFiles;
              
              // Buscar subcarpetas anidadas de esta subcarpeta
              const nestedSubfoldersResponse = await folderService.getSubfolders(subfolder._id);
              const nestedSubfolders = (nestedSubfoldersResponse as any).subcarpetas || nestedSubfoldersResponse || [];
              if (nestedSubfolders.length > 0) {
                count += await countFilesRecursively(nestedSubfolders);
              }
            } catch (error) {
              console.error('❌ Error cargando archivos de subcarpeta', subfolder.name, ':', error);
            }
          }
          return count;
        };
        
        // Contar archivos de subcarpetas recursivamente
        const subfolderFiles = await countFilesRecursively(subfolders);
        totalFiles += subfolderFiles;
        
        console.log('📊 Total de archivos calculado:', totalFiles);
        
        // Actualizar la carpeta con el total de archivos
        setFolder({
          ...folderData,
          totalFiles: totalFiles
        } as any);
        
      } catch (subfolderError) {
        console.error('❌ Error cargando subcarpetas:', subfolderError);
        setSubfolders([]);
        setFolder(folderData as any);
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
    if (folderId) {
      await loadFolderDetails();
    } else {
      await loadMainFolders();
    }
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
      
      Alert.alert('Éxito', 'Archivo subido correctamente', [
        {
          text: 'OK',
          onPress: () => {
            setShowUploadModal(false);
            resetForm();
            refreshFolder(); // Recargar la lista
          }
        }
      ]);
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

  const openSubfolder = (subfolder: Folder) => {
    console.log('🔄 Navegando a subcarpeta:', subfolder.name, subfolder._id);
    // Navegar a la subcarpeta (siempre puede tener subcarpetas)
    (navigation as any).navigate('SubirArchivo', { 
      folderId: subfolder._id,
      folderName: subfolder.name,
      isMainFolder: true, // Cambiar a true para que siempre cargue subcarpetas
      parentFolderId: folderId, // Agregar ID de carpeta padre para navegación
      parentFolderName: folderName // Agregar nombre de carpeta padre
    });
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

  const handleDeleteFile = async (file: File) => {
    Alert.alert(
      'Eliminar Archivo',
      `¿Estás seguro de que quieres eliminar "${file.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await fileService.deleteFile(file._id);
              Alert.alert('Éxito', 'Archivo eliminado correctamente');
              refreshFolder(); // Recargar la lista
            } catch (error: any) {
              console.error('Error eliminando archivo:', error);
              Alert.alert('Error', 'No se pudo eliminar el archivo: ' + (error.response?.data?.msg || error.message));
            }
          }
        }
      ]
    );
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

  // Filtrar archivos basado en la búsqueda
  const filteredFiles = folder?.files?.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando carpetas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
            onPress={() => {
              console.log('🔄 Navegando hacia atrás desde:', folderName);
              console.log('📁 Carpeta padre (parámetros):', parentFolderName, parentFolderId);
              console.log('📁 Carpeta actual:', folder);
              
              // Intentar obtener la carpeta padre de los parámetros o de la carpeta actual
              let targetParentId = parentFolderId;
              let targetParentName = parentFolderName;
              
              if (!targetParentId && folder?.parentFolder) {
                targetParentId = typeof folder.parentFolder === 'string' 
                  ? folder.parentFolder 
                  : folder.parentFolder._id;
                targetParentName = typeof folder.parentFolder === 'string' 
                  ? 'Carpeta Padre' 
                  : folder.parentFolder.name;
                console.log('📁 Carpeta padre (de carpeta actual):', targetParentName, targetParentId);
              }
              
              if (targetParentId && targetParentName) {
                // Navegar a la carpeta padre
                console.log('🔄 Navegando a carpeta padre:', targetParentName, targetParentId);
                (navigation as any).navigate('SubirArchivo', {
                  folderId: targetParentId,
                  folderName: targetParentName,
                  isMainFolder: true
                });
              } else {
                // Si no hay carpeta padre, ir al dashboard
                console.log('🔄 Navegando al dashboard');
                (navigation as any).navigate('AdminDashboard');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#3498db" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            {folder ? (
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Gestionar Archivos</Text>
                <Text style={styles.headerSubtitle}>{folder.name}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#27ae60" />
                <Text style={styles.headerTitle}>Subir Archivos</Text>
              </>
            )}
          </View>
          
          {folder && (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => openUploadModal(folder._id)}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Subir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Información de la carpeta - Solo mostrar card simple como en segunda imagen */}
        {folder && (
          <View style={styles.folderInfo}>
            <View style={styles.infoCard}>
              <View style={styles.folderHeader}>
                <Ionicons name="folder" size={24} color="#3498db" />
                <View style={styles.folderInfoText}>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.folderDescription}>
                    {folder.parentFolder ? 'Subcarpeta' : 'Carpeta Principal'}
                  </Text>
                  <Text style={styles.folderStats}>
                    📄 {(folder as any).totalFiles || folder.files?.length || 0} archivos
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Subcarpetas - Solo si estamos dentro de una carpeta específica */}
        {folder && subfolders.length > 0 && (
          <View style={styles.subfoldersContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder-open" size={20} color="#27ae60" />
              <Text style={styles.sectionTitle}>Subcarpetas</Text>
            </View>
            
            {subfolders.map((subfolder) => (
              <TouchableOpacity
                key={subfolder._id}
                style={styles.subfolderCard}
                onPress={() => openSubfolder(subfolder)}
                activeOpacity={0.7}
              >
                <View style={styles.subfolderContent}>
                  <Ionicons name="folder" size={24} color="#27ae60" />
                  <View style={styles.subfolderInfo}>
                    <Text style={styles.subfolderName}>{subfolder.name}</Text>
                    <Text style={styles.subfolderFiles}>
                      {subfolder.files?.length || 0} archivos
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Carpetas principales - Solo si no estamos dentro de una carpeta específica */}
        {!folder && subfolders.length > 0 && (
          <View style={styles.mainFoldersContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Carpetas Principales</Text>
            </View>
            
            {subfolders.map((mainFolder) => (
              <View key={mainFolder._id} style={styles.folderCard}>
                <View style={styles.folderHeader}>
                  <Text style={styles.folderIcon}>📁</Text>
                  <View style={styles.folderInfo}>
                    <Text style={styles.folderName}>{mainFolder.name}</Text>
                    <Text style={styles.folderStats}>
                      📄 {(mainFolder as any).totalFiles || 0} archivos • 📁 {(mainFolder as any).subfolders?.length || 0} subcarpetas
                    </Text>
                  </View>
                </View>
                
                <View style={styles.folderActions}>
                  <TouchableOpacity 
                    style={styles.enterFolderButton}
                    onPress={() => openSubfolder(mainFolder)}
                  >
                    <View style={styles.enterFolderButtonContent}>
                      <Ionicons name="folder-open" size={20} color="white" />
                      <Text style={styles.enterFolderText}>Entrar a carpeta</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Lista de archivos */}
        {folder && (
          <View style={styles.filesContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="attach" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Archivos</Text>
            </View>
            
            {/* Buscador de archivos */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar archivos..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#7f8c8d"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Ionicons name="close-circle" size={20} color="#7f8c8d" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {!folder.files || folder.files.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open" size={48} color="#f39c12" />
                <Text style={styles.emptyStateTitle}>No hay archivos</Text>
                <Text style={styles.emptyStateText}>
                  Esta carpeta no contiene archivos aún.
                </Text>
              </View>
            ) : filteredFiles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color="#f39c12" />
                <Text style={styles.emptyStateTitle}>No se encontraron archivos</Text>
                <Text style={styles.emptyStateText}>
                  No hay archivos que coincidan con tu búsqueda.
                </Text>
              </View>
            ) : (
              <View style={styles.filesList}>
                {filteredFiles.map((file) => (
                  <View key={file._id} style={styles.fileCard}>
                    <View style={styles.fileInfoContainer}>
                      <View style={styles.fileIcon}>
                        <Ionicons name={getFileIcon(file.mimeType)} size={24} color="#3498db" />
                      </View>
                      
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName}>
                          {file.name}
                        </Text>
                        {file.description && (
                          <Text style={styles.fileDescription} numberOfLines={1}>
                            {file.description}
                          </Text>
                        )}
                        <Text style={styles.fileDetails}>
                          {file.tipo} • {formatFileSize(file.size || 0)}
                          {file.createdAt && ` • ${new Date(file.createdAt).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          })}`}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFile(file)}
                    >
                      <Ionicons name="trash" size={20} color="white" />
                      <Text style={styles.deleteButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
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
  headerSpacer: {
    width: 48,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  folderInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  folderStats: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  mainFoldersContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  subfoldersContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
  folderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  folderActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  enterFolderButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  enterFolderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterFolderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  subfolderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subfolderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  subfolderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subfolderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subfolderFiles: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
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
    marginTop: 0,
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
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});