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
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Folder {
  _id: string;
  name: string;
  parentFolder?: string | null;
  files: any[];
  usuarios: string[];
  createdAt: string;
}

export default function CarpetasScreen() {
  const [allFolders, setAllFolders] = useState<Folder[]>([]); // Todas las carpetas
  const [folders, setFolders] = useState<Folder[]>([]); // Solo carpetas principales para mostrar
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  
  // Formulario de nueva carpeta
  const [newFolder, setNewFolder] = useState({
    name: '',
    parentFolder: null as string | null,
    files: [],
    showSubfolderInput: false,
    subfolderName: '',
    subfolders: [] as string[] // Added for visual list of subfolders
  });
  
  // Formulario de edición
  const [editFolder, setEditFolder] = useState({
    name: '',
    files: []
  });
  
  // Subcarpetas a editar (cuando se edita una carpeta principal)
  const [subfoldersToEdit, setSubfoldersToEdit] = useState<Folder[]>([]);
  
  // Estado para el modal de selección de subcarpetas
  const [showSubfolderModal, setShowSubfolderModal] = useState(false);
  const [selectedSubfolders, setSelectedSubfolders] = useState<string[]>([]);
  const [currentMainFolder, setCurrentMainFolder] = useState<Folder | null>(null);
  const [currentSubfolders, setCurrentSubfolders] = useState<Folder[]>([]);

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const foldersData = await folderService.listFolders();
      
      console.log('📁 Todas las carpetas cargadas:', foldersData);
      
      // Ordenar carpetas: primero las principales, luego las subcarpetas
      const sortedFolders = foldersData.sort((a, b) => {
        // Si ambas son principales o ambas son subcarpetas, ordenar por nombre
        if ((!a.parentFolder && !b.parentFolder) || (a.parentFolder && b.parentFolder)) {
          return a.name.localeCompare(b.name);
        }
        // Las carpetas principales van primero
        if (!a.parentFolder && b.parentFolder) return -1;
        if (a.parentFolder && !b.parentFolder) return 1;
        return 0;
      });
      
      console.log('📁 Carpetas ordenadas:', sortedFolders);
      
      const mainFolders = sortedFolders.filter(folder => !folder.parentFolder);
      console.log('📁 Solo carpetas principales:', mainFolders);
      
      setAllFolders(sortedFolders);
      setFolders(mainFolders); // Solo carpetas principales
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la carpeta');
      return;
    }

    setIsLoading(true);
    try {
      // Crear la carpeta principal primero
      const mainFolderData = {
        name: newFolder.name,
        parentFolder: null,
        files: []
      };

      console.log('📁 Creando carpeta principal:', mainFolderData);
      const mainFolder = await folderService.createFolder(mainFolderData);
      console.log('✅ Carpeta principal creada:', mainFolder);
      
      // Extraer el ID de la respuesta anidada del backend
      const mainFolderId = mainFolder.folder?._id || mainFolder._id;
      console.log('🆔 ID de la carpeta principal:', mainFolderId);
      
      // Crear todas las subcarpetas agregadas
      if (newFolder.subfolders.length > 0) {
        console.log('📁 Creando subcarpetas:', newFolder.subfolders);
        for (const subfolderName of newFolder.subfolders) {
          const subfolderData = {
            name: subfolderName,
            parentFolder: mainFolderId, // Usar el ID extraído correctamente
            files: []
          };
          
          console.log('📁 Creando subcarpeta:', subfolderData);
          console.log('🔗 parentFolder ID:', mainFolderId);
          const subfolder = await folderService.createFolder(subfolderData);
          console.log('✅ Subcarpeta creada:', subfolder);
        }
        
        Alert.alert('✅ Éxito', `Carpeta "${newFolder.name}" creada con ${newFolder.subfolders.length} subcarpeta${newFolder.subfolders.length > 1 ? 's' : ''}`);
      } else {
        Alert.alert('✅ Éxito', `Carpeta "${newFolder.name}" creada correctamente`);
      }
      
      setShowCreateModal(false);
      setNewFolder({ name: '', parentFolder: null, files: [], showSubfolderInput: false, subfolderName: '', subfolders: [] });
      loadData();
    } catch (error: any) {
      console.error('Error creando carpeta:', error);
      Alert.alert('Error', 'No se pudo crear la carpeta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFolder = async () => {
    if (!editFolder.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la carpeta');
      return;
    }

    if (!editingFolder) {
      Alert.alert('Error', 'No se encontró la carpeta a editar');
      return;
    }

    try {
      // Actualizar la carpeta principal
      await folderService.updateFolder(editingFolder._id, { name: editFolder.name });
      
      // Si es una carpeta principal y tiene subcarpetas, actualizarlas también
      if (!editingFolder.parentFolder && subfoldersToEdit.length > 0) {
        console.log('🔄 Actualizando subcarpetas:', subfoldersToEdit);
        
        // Actualizar cada subcarpeta
        for (const subfolder of subfoldersToEdit) {
          try {
            await folderService.updateFolder(subfolder._id, { name: subfolder.name });
            console.log(`✅ Subcarpeta "${subfolder.name}" actualizada`);
          } catch (error) {
            console.error(`❌ Error actualizando subcarpeta "${subfolder.name}":`, error);
          }
        }
        
        Alert.alert('✅ Éxito', `Carpeta "${editFolder.name}" y ${subfoldersToEdit.length} subcarpeta${subfoldersToEdit.length > 1 ? 's' : ''} actualizadas correctamente`);
      } else {
        Alert.alert('✅ Éxito', 'Carpeta actualizada correctamente');
      }
      
      setShowEditModal(false);
      setEditingFolder(null);
      setEditFolder({ name: '', files: [] });
      setSubfoldersToEdit([]);
      loadData(); // Recargar datos para mostrar cambios
    } catch (error: any) {
      console.error('Error actualizando carpeta:', error);
      Alert.alert('Error', 'No se pudo actualizar la carpeta');
    }
  };

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setEditFolder({
      name: folder.name,
      files: folder.files || []
    });
    
    // Si es una carpeta principal, obtener sus subcarpetas
    if (!folder.parentFolder) {
      const subfolders = allFolders.filter(f => {
        if (f.parentFolder) {
          if (typeof f.parentFolder === 'object' && f.parentFolder._id) {
            return f.parentFolder._id === folder._id;
          }
          return f.parentFolder === folder._id;
        }
        return false;
      });
      setSubfoldersToEdit(subfolders);
      console.log('📁 Subcarpetas encontradas para editar:', subfolders);
    } else {
      setSubfoldersToEdit([]);
    }
    
    setShowEditModal(true);
  };

  const handleDeleteFolder = (folder: Folder) => {
    // Si es una carpeta principal con subcarpetas, mostrar opciones
    if (!folder.parentFolder) {
      const subfolders = allFolders.filter(f => {
        if (f.parentFolder) {
          if (typeof f.parentFolder === 'object' && f.parentFolder._id) {
            return f.parentFolder._id === folder._id;
          }
          return f.parentFolder === folder._id;
        }
        return false;
      });

      if (subfolders.length > 0) {
        Alert.alert(
          'Eliminar Carpeta',
          `"${folder.name}" tiene ${subfolders.length} subcarpeta${subfolders.length > 1 ? 's' : ''}. ¿Qué deseas eliminar?`,
          [
            {
              text: 'Solo esta carpeta',
              style: 'default',
              onPress: () => deleteFolder(folder, false)
            },
            {
              text: 'Seleccionar subcarpetas',
              style: 'default',
              onPress: () => showSubfolderSelection(folder, subfolders)
            },
            {
              text: 'Carpeta + todas las subcarpetas',
              style: 'destructive',
              onPress: () => deleteFolder(folder, true)
            },
            {
              text: 'Cancelar',
              style: 'cancel'
            }
          ]
        );
        return;
      }
    }
    
    // Eliminar carpeta individual (sin subcarpetas o es una subcarpeta)
    deleteFolder(folder, false);
  };

  const deleteFolder = async (folder: Folder, withSubfolders: boolean) => {
    try {
      if (withSubfolders) {
        // Eliminar subcarpetas primero
        const subfolders = allFolders.filter(f => {
          if (f.parentFolder) {
            if (typeof f.parentFolder === 'object' && f.parentFolder._id) {
              return f.parentFolder._id === folder._id;
            }
            return f.parentFolder === folder._id;
          }
          return false;
        });
        
        console.log('🗑️ Eliminando subcarpetas:', subfolders);
        
        for (const subfolder of subfolders) {
          await folderService.deleteFolder(subfolder._id);
          console.log(`✅ Subcarpeta "${subfolder.name}" eliminada`);
        }
        
        // Luego eliminar la carpeta principal
        await folderService.deleteFolder(folder._id);
        console.log(`✅ Carpeta principal "${folder.name}" eliminada`);
        
        Alert.alert('✅ Éxito', `Carpeta "${folder.name}" y ${subfolders.length} subcarpeta${subfolders.length > 1 ? 's' : ''} eliminadas`);
      } else {
        await folderService.deleteFolder(folder._id);
        console.log(`✅ Carpeta "${folder.name}" eliminada`);
        Alert.alert('✅ Éxito', `Carpeta "${folder.name}" eliminada`);
      }
      
      loadData(); // Recargar datos para mostrar cambios
    } catch (error: any) {
      console.error('Error eliminando carpeta:', error);
      Alert.alert('Error', 'No se pudo eliminar la carpeta');
    }
  };

  const showSubfolderSelection = (mainFolder: Folder, subfolders: Folder[]) => {
    setCurrentMainFolder(mainFolder);
    setCurrentSubfolders(subfolders);
    setSelectedSubfolders([]); // Resetear selecciones
    setShowSubfolderModal(true);
  };

  const toggleSubfolderSelection = (subfolderId: string) => {
    setSelectedSubfolders(prev => {
      if (prev.includes(subfolderId)) {
        return prev.filter(id => id !== subfolderId);
      } else {
        return [...prev, subfolderId];
      }
    });
  };

  const deleteSelectedSubfolders = async () => {
    if (selectedSubfolders.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos una subcarpeta');
      return;
    }

    try {
      console.log('🗑️ Eliminando subcarpetas seleccionadas:', selectedSubfolders);
      
      // Eliminar solo las subcarpetas seleccionadas
      for (const subfolderId of selectedSubfolders) {
        await folderService.deleteFolder(subfolderId);
        console.log(`✅ Subcarpeta eliminada`);
      }
      
      Alert.alert('✅ Éxito', `${selectedSubfolders.length} subcarpeta${selectedSubfolders.length > 1 ? 's' : ''} eliminada${selectedSubfolders.length > 1 ? 's' : ''}`);
      
      setShowSubfolderModal(false);
      setCurrentMainFolder(null);
      setCurrentSubfolders([]);
      setSelectedSubfolders([]);
      
      loadData(); // Recargar datos para mostrar cambios
    } catch (error: any) {
      console.error('Error eliminando subcarpetas seleccionadas:', error);
      Alert.alert('Error', 'No se pudieron eliminar las subcarpetas');
    }
  };

  const handleCleanupFolders = async () => {
    Alert.alert(
      'Limpiar Carpetas',
      '¿Estás seguro de que quieres eliminar todas las carpetas vacías?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              await folderService.deleteEmptyFolders();
              Alert.alert('Éxito', 'Carpetas vacías eliminadas correctamente');
              loadData();
            } catch (error: any) {
              console.error('Error limpiando carpetas:', error);
              Alert.alert('Error', 'No se pudieron eliminar las carpetas vacías');
            }
          }
        }
      ]
    );
  };

  const handleDebugFolders = async () => {
    Alert.alert(
      'Debug de Carpetas',
      'Esta función mostrará la estructura completa de las carpetas en la consola.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mostrar',
          style: 'default',
          onPress: async () => {
            try {
              const allFolders = await folderService.listFolders();
              console.log('📁 Estructura de Carpetas Completa:');
              console.log(JSON.stringify(allFolders, null, 2));
              Alert.alert('Debug', 'Estructura de carpetas mostrada en la consola.');
            } catch (error: any) {
              console.error('Error al mostrar estructura de carpetas:', error);
              Alert.alert('Error', 'No se pudo mostrar la estructura de carpetas.');
            }
          }
        }
      ]
    );
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
            <Ionicons name="folder" size={24} color="#FFD700" />
            <Text style={styles.headerTitle}>Gestión de Carpetas</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={handleDebugFolders}
            >
              <Ionicons name="bug" size={20} color="#9b59b6" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cleanupButton} 
              onPress={handleCleanupFolders}
            >
              <Ionicons name="trash" size={20} color="#e74c3c" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
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
          {folders.map((folder) => (
            <View key={folder._id} style={[
              styles.folderCard,
              folder.parentFolder && styles.subfolderCard // Estilo especial para subcarpetas
            ]}>
              <View style={styles.folderHeader}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderDescription}>
                  {folder.parentFolder ? 
                    `Subcarpeta de "${folders.find(f => f._id === folder.parentFolder)?.name || 'Desconocida'}"` :
                    'Carpeta de archivos'
                  }
                </Text>
              </View>
              
              <View style={styles.folderInfo}>
                <View style={styles.folderDateContainer}>
                  <Ionicons name="calendar" size={16} color="#95a5a6" />
                  <Text style={styles.folderDate}>
                    Creada: {new Date(folder.createdAt).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <View style={styles.folderStatsRow}>
                  <View style={styles.folderStats}>
                    <View style={styles.folderStat}>
                      <Ionicons name="document" size={16} color="#95a5a6" />
                      <Text style={styles.folderStatText}>
                        {folder.files?.length || 0} archivos
                      </Text>
                    </View>
                    <View style={styles.folderStat}>
                      <Ionicons name="people" size={16} color="#95a5a6" />
                      <Text style={styles.folderStatText}>
                        {folder.usuarios?.length || 0} usuarios
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.folderActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditModal(folder)}
                    >
                      <Ionicons name="create" size={18} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteFolder(folder)}
                    >
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Mostrar subcarpetas en línea separada si es una carpeta principal */}
                {!folder.parentFolder && (
                  <View style={styles.subfolderStatsRow}>
                    <View style={styles.folderStat}>
                      <Ionicons name="folder-open" size={16} color="#f39c12" />
                      <Text style={styles.folderStatText}>
                        {(() => {
                          const subfolderCount = allFolders.filter(f => {
                            // Verificar si es subcarpeta de esta carpeta principal
                            if (f.parentFolder) {
                              // Si parentFolder es un objeto populado, usar su _id
                              if (typeof f.parentFolder === 'object' && f.parentFolder._id) {
                                return f.parentFolder._id === folder._id;
                              }
                              // Si parentFolder es un string, comparar directamente
                              return f.parentFolder === folder._id;
                            }
                            return false;
                          }).length;
                          
                          console.log(`📁 Contando subcarpetas para "${folder.name}": ${subfolderCount}`);
                          return subfolderCount;
                        })()} subcarpetas
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Modal para crear carpeta */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Ionicons name="folder" size={24} color="#007AFF" />
                <Text style={styles.modalTitle}>Crear Nueva Carpeta</Text>
              </View>
              
              <Text style={styles.inputLabel}>Nombre de la carpeta principal</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Documentos Básicos"
                value={newFolder.name}
                onChangeText={(text) => setNewFolder(prev => ({ ...prev, name: text }))}
              />
              
              <View style={styles.subfolderSection}>
                <Text style={styles.sectionSubtitle}>Subcarpetas (opcional)</Text>
                <Text style={styles.sectionDescription}>
                  Puedes agregar subcarpetas dentro de esta carpeta principal
                </Text>
                
                {/* Mostrar subcarpetas ya agregadas */}
                {newFolder.subfolders.length > 0 && (
                  <View style={styles.subfoldersList}>
                    <Text style={styles.subfoldersListTitle}>Subcarpetas agregadas:</Text>
                    {newFolder.subfolders.map((subfolder, index) => (
                      <View key={index} style={styles.subfolderItem}>
                        <Ionicons name="folder-open" size={16} color="#f39c12" />
                        <Text style={styles.subfolderItemText}>{subfolder}</Text>
                        <TouchableOpacity
                          style={styles.removeSubfolderButton}
                          onPress={() => {
                            setNewFolder(prev => ({
                              ...prev,
                              subfolders: prev.subfolders.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Ionicons name="close-circle" size={16} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                
                {!newFolder.showSubfolderInput ? (
                  <TouchableOpacity
                    style={styles.addSubfolderButton}
                    onPress={() => setNewFolder(prev => ({ ...prev, showSubfolderInput: true }))}
                  >
                    <Ionicons name="add-circle" size={20} color="#007AFF" />
                    <Text style={styles.addSubfolderText}>Agregar Subcarpeta</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.subfolderInputContainer}>
                    <Text style={styles.inputLabel}>Nombre de la subcarpeta</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: Documentos Internos"
                      value={newFolder.subfolderName}
                      onChangeText={(text) => setNewFolder(prev => ({ ...prev, subfolderName: text }))}
                    />
                    
                    <View style={styles.subfolderActions}>
                      <TouchableOpacity
                        style={[styles.subfolderActionButton, styles.cancelSubfolderButton]}
                        onPress={() => setNewFolder(prev => ({ 
                          ...prev, 
                          showSubfolderInput: false, 
                          subfolderName: '',
                          parentFolder: null
                        }))}
                      >
                        <Text style={styles.cancelSubfolderText}>Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.subfolderActionButton, styles.confirmSubfolderButton]}
                        onPress={() => {
                          if (!newFolder.subfolderName.trim()) {
                            Alert.alert('Error', 'Por favor ingresa el nombre de la subcarpeta');
                            return;
                          }
                          
                          // Agregar la subcarpeta a la lista
                          setNewFolder(prev => ({ 
                            ...prev, 
                            subfolders: [...prev.subfolders, prev.subfolderName],
                            subfolderName: '',
                            showSubfolderInput: false
                          }));
                          
                          Alert.alert('✅ Agregada', `Subcarpeta "${newFolder.subfolderName}" agregada a la lista`);
                        }}
                      >
                        <Text style={styles.confirmSubfolderText}>Crear Subcarpeta</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
              
              <Text style={styles.inputLabel}>Descripción</Text>
              <Text style={styles.descriptionText}>
                {newFolder.subfolderName.trim() ? 
                  `Esta carpeta se creará con subcarpeta "${newFolder.subfolderName}"` :
                  'Esta carpeta se creará para almacenar archivos relacionados con "' + newFolder.name + '"'
                }
              </Text>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateFolder}
                >
                  <Text style={styles.createButtonText}>Crear Carpeta</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Modal para editar carpeta */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="create" size={24} color="#f39c12" />
                <Text style={styles.modalTitle}>Editar Carpeta</Text>
              </View>
              
              <Text style={styles.inputLabel}>Nombre de la carpeta</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Documentos Básicos"
                value={editFolder.name}
                onChangeText={(text) => setEditFolder(prev => ({ ...prev, name: text }))}
              />
              
              {/* Mostrar subcarpetas para editar si es una carpeta principal */}
              {editingFolder && !editingFolder.parentFolder && subfoldersToEdit.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Subcarpetas</Text>
                  <View style={styles.subfoldersContainer}>
                    {console.log('🔍 Renderizando subcarpetas:', subfoldersToEdit)}
                    {subfoldersToEdit.map((subfolder, index) => (
                      <View key={subfolder._id} style={styles.subfolderEditItem}>
                        <TextInput
                          style={styles.subfolderInput}
                          value={subfolder.name}
                          onChangeText={(text) => {
                            const updatedSubfolders = [...subfoldersToEdit];
                            updatedSubfolders[index] = { ...subfolder, name: text };
                            setSubfoldersToEdit(updatedSubfolders);
                          }}
                          placeholder="Nombre de la subcarpeta"
                        />
                      </View>
                    ))}
                  </View>
                </>
              )}
              
              <Text style={styles.inputLabel}>Descripción</Text>
              <Text style={styles.descriptionText}>
                Esta carpeta almacena archivos relacionados con "{editFolder.name}"
              </Text>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingFolder(null);
                    setEditFolder({ name: '', files: [] });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.editButton]}
                  onPress={handleEditFolder}
                >
                  <Text style={styles.editButtonText}>Actualizar Carpeta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de selección de subcarpetas */}
        <Modal
          visible={showSubfolderModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSubfolderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="folder-open" size={24} color="#007AFF" />
                <Text style={styles.modalTitle}>Seleccionar Subcarpetas para Eliminar</Text>
              </View>
              
              <Text style={styles.inputLabel}>Carpeta Principal: {currentMainFolder?.name || 'N/A'}</Text>
              <View style={styles.subfoldersContainer}>
                {currentSubfolders.map(subfolder => (
                  <View key={subfolder._id} style={styles.subfolderItem}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => toggleSubfolderSelection(subfolder._id)}
                    >
                      {selectedSubfolders.includes(subfolder._id) ? (
                        <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={20} color="#95a5a6" />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.subfolderItemText}>{subfolder.name}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowSubfolderModal(false);
                    setCurrentMainFolder(null);
                    setCurrentSubfolders([]);
                    setSelectedSubfolders([]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmSubfolderButton]}
                  onPress={deleteSelectedSubfolders}
                >
                  <Text style={styles.confirmSubfolderText}>Eliminar Seleccionadas</Text>
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
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  debugButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cleanupButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    marginLeft: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },

  foldersList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  folderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  folderHeader: {
    marginBottom: 16,
  },
  folderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  folderDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  folderInfo: {
    marginBottom: 16,
  },
  folderDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  folderDate: {
    fontSize: 14,
    color: '#95a5a6',
    marginLeft: 8,
    fontWeight: '500',
  },
  folderStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  folderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  folderStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderStatText: {
    fontSize: 14,
    color: '#95a5a6',
    marginLeft: 8,
    fontWeight: '500',
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 16,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 28,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    gap: 16,
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
  createButton: {
    backgroundColor: '#27ae60',
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Estilos para subcarpetas
  subfolderSection: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'center',
  },
  addSubfolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  addSubfolderText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 10,
  },
  subfolderInputContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
  },
  subfolderActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  subfolderActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelSubfolderButton: {
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  confirmSubfolderButton: {
    backgroundColor: '#dc3545',
  },
  cancelSubfolderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  confirmSubfolderText: {
    color: 'white',
    fontWeight: 'bold',
  },
  subfolderStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  subfoldersList: {
    marginTop: 15,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  subfoldersListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginLeft: 5,
  },
  subfolderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subfolderItemText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  removeSubfolderButton: {
    padding: 5,
  },
  subfolderCard: {
    marginLeft: 20, // Indentación para subcarpetas
    borderLeftWidth: 2, // Línea izquierda para subcarpetas
    borderLeftColor: '#e0e0e0', // Color de la línea
  },
  subfoldersContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  subfolderEditItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subfolderInput: {
    fontSize: 14,
    color: '#34495e',
    paddingVertical: 0, // Remove default padding
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
});
