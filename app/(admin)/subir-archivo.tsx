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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';
import { authService } from '../../services/authService';
import * as DocumentPicker from 'expo-document-picker';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  parentFolder?: string | null | { _id: string; name: string };
}

interface FileData {
  nombre: string;
  descripcion: string;
  carpetaId: string;
  archivo: any;
  clienteDestinatario: string;
}

interface User {
  _id: string;
  email: string;
  companyName: string;
  rol: string;
}

export default function SubirArchivoScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [mainFolders, setMainFolders] = useState<Folder[]>([]);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [selectedMainFolder, setSelectedMainFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSubfolderModal, setShowSubfolderModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [hasShownInitialPopup, setHasShownInitialPopup] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState(''); // Estado para el buscador de destinatarios
  const [folderSearchQuery, setFolderSearchQuery] = useState(''); // Estado para el buscador de carpetas
  
  // Formulario de archivo
  const [fileData, setFileData] = useState<FileData>({
    nombre: '',
    descripcion: '',
    carpetaId: '',
    archivo: null,
    clienteDestinatario: ''
  });

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    loadFolders();
    loadUsers();
  }, []);

  // Detectar si viene desde GestionarArchivos y mostrar popup automáticamente
  useEffect(() => {
    if (route.params && !isLoading && !hasShownInitialPopup) {
      const { folderId, folderName, isMainFolder } = route.params as any;
      if (folderId && folderName) {
        console.log('🎯 Detectado parámetros de navegación:', { folderId, folderName, isMainFolder });
        
        // Buscar la carpeta seleccionada (puede ser principal o subcarpeta)
        let targetFolder;
        if (isMainFolder === false) {
          // Es una subcarpeta, buscar en todas las carpetas
          targetFolder = folders.find(f => f._id === folderId);
        } else {
          // Es una carpeta principal
          targetFolder = mainFolders.find(f => f._id === folderId);
        }
        
        if (targetFolder) {
          console.log('✅ Carpeta encontrada:', targetFolder.name, 'Tipo:', isMainFolder === false ? 'Subcarpeta' : 'Carpeta Principal');
          
          // Si es una subcarpeta, también necesitamos encontrar su carpeta principal
          if (isMainFolder === false && targetFolder.parentFolder) {
            const parentFolderId = typeof targetFolder.parentFolder === 'object' 
              ? targetFolder.parentFolder._id 
              : targetFolder.parentFolder;
            const parentFolder = mainFolders.find(f => f._id === parentFolderId);
            if (parentFolder) {
              setSelectedMainFolder(parentFolder);
            }
          } else {
            setSelectedMainFolder(targetFolder);
          }
          
          setFileData(prev => ({
            ...prev,
            carpetaId: folderId
          }));
          
          // Mostrar el popup de subir archivos después de que todo esté cargado
          setTimeout(() => {
            console.log('🚀 Mostrando popup de subir archivos');
            setShowUploadModal(true);
            setHasShownInitialPopup(true); // Marcar que ya se mostró el popup inicial
          }, 1000);
        } else {
          console.log('❌ Carpeta no encontrada con ID:', folderId);
        }
      }
    }
  }, [mainFolders, folders, route.params, isLoading, hasShownInitialPopup]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const foldersData = await folderService.listFolders();
      
      // Separar carpetas principales de subcarpetas
      const mainFoldersData = foldersData.filter((folder: any) => !folder.parentFolder);
      const subfoldersData = foldersData.filter((folder: any) => folder.parentFolder);
      
      setFolders(foldersData);
      setMainFolders(mainFoldersData);
      setSubfolders(subfoldersData);
    } catch (error: any) {
      console.error('Error cargando carpetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔄 Cargando usuarios...');
      console.log('🔍 Usuario actual:', currentUser?.email);
      
      const usersData = await authService.listUsers();
      console.log('✅ Usuarios cargados:', usersData.length);
      console.log('📋 Datos de usuarios:', usersData);
      
      // Filtrar solo usuarios (no administradores)
      const clientUsers = usersData.filter((user: User) => user.rol === 'usuario');
      console.log('👥 Clientes encontrados:', clientUsers.length);
      console.log('👥 Clientes filtrados:', clientUsers);
      setUsers(clientUsers);
    } catch (error: any) {
      console.error('❌ Error cargando usuarios:', error);
      console.error('❌ Error completo:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `No se pudieron cargar los usuarios: ${error.message || error}`);
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
    if (!fileData.nombre.trim() || !fileData.descripcion.trim() || !fileData.carpetaId || !selectedFile || !fileData.clienteDestinatario) {
      Alert.alert('Error', 'Por favor completa todos los campos, selecciona un archivo y un cliente destinatario');
      return;
    }

    try {
      setIsUploading(true);
      
      // Subir archivo usando el servicio
      await fileService.uploadFile({
        nombre: fileData.nombre,
        descripcion: fileData.descripcion,
        carpetaId: fileData.carpetaId,
        archivo: selectedFile,
        clienteDestinatario: fileData.clienteDestinatario
      });
      
      Alert.alert('Éxito', 'Archivo subido correctamente', [
        {
          text: 'OK',
          onPress: () => {
            setShowUploadModal(false);
            resetForm();
            // Simplemente regresar a la pantalla anterior
            navigation.goBack();
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

  const handleDeleteFile = async (fileId: string, folderId: string) => {
    Alert.alert(
      'Eliminar Archivo',
      '¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Eliminando archivo:', fileId);
              
              // Mostrar indicador de carga
              Alert.alert('Eliminando...', 'Por favor espera mientras se elimina el archivo.');
              
              await fileService.deleteFile(fileId);
              
              // Cerrar el alert de carga
              Alert.alert('✅ Éxito', 'Archivo eliminado correctamente', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Recargar la lista de carpetas
                    loadFolders();
                  }
                }
              ]);
            } catch (error: any) {
              console.error('❌ Error eliminando archivo:', error);
              Alert.alert(
                '❌ Error', 
                'No se pudo eliminar el archivo. Verifica tu conexión a internet.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setFileData({
      nombre: '',
      descripcion: '',
      carpetaId: '',
      archivo: null,
      clienteDestinatario: ''
    });
    setSelectedFile(null);
    setShowClientSelector(false);
  };

  const handleClientSelect = (clientId: string) => {
    setFileData(prev => ({ ...prev, clienteDestinatario: clientId }));
    setShowClientSelector(false);
  };

  const getSelectedClientName = () => {
    if (!fileData.clienteDestinatario) return 'Seleccionar cliente';
    const client = users.find(u => u._id === fileData.clienteDestinatario);
    return client ? `${client.companyName} (${client.email})` : 'Cliente seleccionado';
  };

  const openSubfolderModal = (mainFolder: Folder) => {
    console.log('Navegando a gestionar archivos para:', mainFolder.name);
    (navigation as any).navigate('GestionarArchivos', {
      folderId: mainFolder._id,
      folderName: mainFolder.name,
      isMainFolder: true
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
        archivo: null,
        clienteDestinatario: ''
      });
    } else {
      // Si no se proporciona carpeta, limpiamos el formulario
      resetForm();
    }
    setShowUploadModal(true);
  };

  const getSubfoldersForMainFolder = (mainFolderId: string) => {
    return subfolders.filter(subfolder => {
      const parentId = typeof subfolder.parentFolder === 'string' 
        ? subfolder.parentFolder 
        : subfolder.parentFolder?._id;
      return parentId === mainFolderId;
    });
  };

  const getTotalFilesInFolder = (folderId: string) => {
    const folder = folders.find(f => f._id === folderId);
    return folder?.files?.length || 0;
  };

  const getTotalFilesInMainFolder = (mainFolder: Folder) => {
    const mainFolderFiles = getTotalFilesInFolder(mainFolder._id);
    const subfoldersForMain = getSubfoldersForMainFolder(mainFolder._id);
    const subfolderFiles = subfoldersForMain.reduce((total, subfolder) => {
      return total + getTotalFilesInFolder(subfolder._id);
    }, 0);
    return mainFolderFiles + subfolderFiles;
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

  // Función helper para obtener el nombre correcto del archivo
  const getFileName = (file: any) => {
    // Intentar diferentes campos posibles
    const possibleNames = [
      file.name,
      file.nombre,
      file.originalName,
      file.originalname,
      file.filename,
      file.fileName
    ];
    
    // Retornar el primer nombre válido que encontremos
    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim() !== '') {
        return name.trim();
      }
    }
    
    // Si no encontramos ningún nombre, usar uno por defecto
    return 'Archivo sin nombre';
  };

  // Función helper para obtener la descripción correcta del archivo
  const getFileDescription = (file: any) => {
    const possibleDescriptions = [
      file.description,
      file.descripcion,
      file.desc,
      file.comment
    ];
    
    for (const desc of possibleDescriptions) {
      if (desc && typeof desc === 'string' && desc.trim() !== '') {
        return desc.trim();
      }
    }
    
    return 'Sin descripción';
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



        {/* Buscador de carpetas */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#95a5a6" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar carpetas..."
              value={folderSearchQuery}
              onChangeText={setFolderSearchQuery}
              placeholderTextColor="#95a5a6"
            />
            {folderSearchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setFolderSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#95a5a6" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lista de carpetas principales */}
        <ScrollView 
          style={styles.foldersList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshFolders} />
          }
        >
          {mainFolders.length === 0 ? (
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
            mainFolders
              .filter(folder => 
                folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase())
              )
              .map((folder) => {
              const subfoldersForMain = getSubfoldersForMainFolder(folder._id);
              const totalFiles = getTotalFilesInMainFolder(folder);
              
              return (
                <View key={folder._id} style={styles.folderCard}>
                  <View style={styles.folderHeader}>
                    <Text style={styles.folderIcon}>📁</Text>
                    <View style={styles.folderInfo}>
                      <Text style={styles.folderName}>{folder.name}</Text>
                      <Text style={styles.folderDescription}>{folder.name}</Text>
                      <Text style={styles.folderStats}>
                        📄 {totalFiles} archivos • 📁 {subfoldersForMain.length} subcarpetas
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.folderActions}>
                    <TouchableOpacity 
                      style={styles.enterFolderButton}
                      onPress={() => openSubfolderModal(folder)}
                    >
                      <View style={styles.enterFolderButtonContent}>
                        <Ionicons name="folder-open" size={20} color="white" />
                        <Text style={styles.enterFolderText}>Entrar a carpeta</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
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
                
                {/* Cliente Destinatario */}
                <View style={styles.clientSection}>
                  <View style={styles.clientHeader}>
                    <Text style={styles.inputLabel}>Cliente Destinatario *</Text>
                    <TouchableOpacity 
                      style={styles.reloadButton}
                      onPress={loadUsers}
                    >
                      <Ionicons name="refresh" size={16} color="#27ae60" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.clientSelector}
                    onPress={() => setShowClientSelector(!showClientSelector)}
                  >
                    <Text style={styles.clientSelectorLabel}>
                      {getSelectedClientName()}
                    </Text>
                    <Ionicons 
                      name={showClientSelector ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#7f8c8d" 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Lista de clientes desplegable */}
                {showClientSelector && (
                  <View style={styles.clientDropdown}>
                    {/* Buscador de clientes */}
                    <View style={styles.clientSearchContainer}>
                      <Ionicons name="search" size={16} color="#95a5a6" style={styles.clientSearchIcon} />
                      <TextInput
                        style={styles.clientSearchInput}
                        placeholder="Buscar cliente..."
                        value={clientSearchQuery}
                        onChangeText={setClientSearchQuery}
                        placeholderTextColor="#95a5a6"
                      />
                      {clientSearchQuery.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => setClientSearchQuery('')}
                          style={styles.clientClearButton}
                        >
                          <Ionicons name="close-circle" size={16} color="#95a5a6" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {users.length > 0 ? (
                      users
                        .filter(user => 
                          user.companyName.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(clientSearchQuery.toLowerCase())
                        )
                        .map((user) => (
                        <TouchableOpacity
                          key={user._id}
                          style={[
                            styles.clientOption,
                            fileData.clienteDestinatario === user._id && styles.selectedClientOption
                          ]}
                          onPress={() => handleClientSelect(user._id)}
                        >
                          <View style={styles.clientInfo}>
                            <Text style={styles.clientName}>{user.companyName}</Text>
                            <Text style={styles.clientEmail}>{user.email}</Text>
                          </View>
                          {fileData.clienteDestinatario === user._id && (
                            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noClientsMessage}>
                        <Ionicons name="people-outline" size={24} color="#7f8c8d" />
                        <Text style={styles.noClientsText}>No hay clientes disponibles</Text>
                        <Text style={styles.noClientsSubtext}>Crea usuarios primero</Text>
                      </View>
                    )}
                  </View>
                )}
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

        {/* Modal para seleccionar subcarpetas */}
        <Modal
          visible={showSubfolderModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowSubfolderModal(false);
            setSelectedMainFolder(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.subfolderModalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Ionicons name="folder-open" size={24} color="#3498db" />
                <Text style={styles.modalTitle}>
                  {selectedMainFolder?.name} - Subcarpetas
                </Text>
              </View>

              {/* Subcarpetas */}
              <ScrollView style={styles.subfolderList} showsVerticalScrollIndicator={false}>
                {/* Opción para subir directamente a la carpeta principal */}
                <TouchableOpacity 
                  style={styles.subfolderItem}
                  onPress={() => {
                    setShowSubfolderModal(false);
                    openUploadModal(selectedMainFolder?._id);
                  }}
                >
                  <View style={styles.subfolderItemContent}>
                    <Text style={styles.subfolderIcon}>📁</Text>
                    <View style={styles.subfolderInfo}>
                      <Text style={styles.subfolderName}>{selectedMainFolder?.name} (Principal)</Text>
                      <Text style={styles.subfolderDescription}>
                        Subir directamente a la carpeta principal
                      </Text>
                      <Text style={styles.subfolderStats}>
                        📄 {getTotalFilesInFolder(selectedMainFolder?._id || '')} archivos
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
                  </View>
                </TouchableOpacity>

                {/* Lista de subcarpetas */}
                {selectedMainFolder && getSubfoldersForMainFolder(selectedMainFolder._id).map((subfolder) => (
                  <TouchableOpacity 
                    key={subfolder._id}
                    style={styles.subfolderItem}
                    onPress={() => {
                      setShowSubfolderModal(false);
                      openUploadModal(subfolder._id);
                    }}
                  >
                    <View style={styles.subfolderItemContent}>
                      <Text style={styles.subfolderIcon}>📂</Text>
                      <View style={styles.subfolderInfo}>
                        <Text style={styles.subfolderName}>{subfolder.name}</Text>
                        <Text style={styles.subfolderDescription}>
                          Subcarpeta de {selectedMainFolder.name}
                        </Text>
                        <Text style={styles.subfolderStats}>
                          📄 {getTotalFilesInFolder(subfolder._id)} archivos
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Mensaje si no hay subcarpetas */}
                {selectedMainFolder && getSubfoldersForMainFolder(selectedMainFolder._id).length === 0 && (
                  <View style={styles.noSubfoldersContainer}>
                    <Text style={styles.noSubfoldersIcon}>📂</Text>
                    <Text style={styles.noSubfoldersText}>
                      No hay subcarpetas en {selectedMainFolder.name}
                    </Text>
                    <Text style={styles.noSubfoldersHint}>
                      Puedes subir archivos directamente a la carpeta principal
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowSubfolderModal(false);
                    setSelectedMainFolder(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
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

  foldersList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  fileDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  fileDetails: {
    fontSize: 11,
    color: '#95a5a6',
  },
  deleteFileButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
    marginLeft: 10,
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
  subfolderModalContainer: {
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
  subfolderList: {
    flex: 1,
    marginBottom: 20,
  },
  subfolderItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subfolderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subfolderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subfolderInfo: {
    flex: 1,
  },
  subfolderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subfolderDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  subfolderStats: {
    fontSize: 12,
    color: '#95a5a6',
  },
  noSubfoldersContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noSubfoldersIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noSubfoldersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  noSubfoldersHint: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  // Estilos para selector de cliente
  clientSection: {
    marginBottom: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  clientSelectorLabel: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  clientDropdown: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    marginTop: -12,
    marginBottom: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectedClientOption: {
    backgroundColor: '#e8f5e8',
    borderColor: '#27ae60',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  noClientsMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noClientsText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  noClientsSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'center',
  },
  // Estilos para el buscador de clientes
  clientSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  clientSearchIcon: {
    marginRight: 8,
  },
  clientSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    paddingVertical: 0,
  },
  clientClearButton: {
    marginLeft: 8,
    padding: 2,
  },
  // Estilos para el buscador de carpetas
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
