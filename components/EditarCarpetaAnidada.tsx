import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { folderService } from '../services/folderService';

interface SubfolderData {
  name: string;
  category: string;
  _id?: string; // ID opcional para edición
  subfolders: SubfolderData[];
}

interface EditarCarpetaAnidadaProps {
  folder: any;
  onClose: () => void;
  onUpdate: () => void;
}

const EditarCarpetaAnidada: React.FC<EditarCarpetaAnidadaProps> = ({ folder, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subfolders: [] as SubfolderData[],
  });
  const [loading, setLoading] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (folder) {
      loadFolderStructure();
    }
  }, [folder]);

  const loadFolderStructure = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando estructura de carpeta:', folder.name);
      
      // Obtener estructura jerárquica completa
      const response = await folderService.getHierarchicalStructure();
      console.log('📁 Estructura jerárquica completa:', response);
      
      // Buscar la carpeta específica en la estructura jerárquica
      const findFolderInHierarchy = (folders: any[], targetId: string): any => {
        for (const folderItem of folders) {
          if (folderItem._id === targetId) {
            return folderItem;
          }
          if (folderItem.subcarpetas && folderItem.subcarpetas.length > 0) {
            const found: any = findFolderInHierarchy(folderItem.subcarpetas, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const folderData = findFolderInHierarchy((response as any).carpetas || [], folder._id);
      console.log('📁 Carpeta encontrada en jerarquía:', folderData);
      
      if (folderData) {
        // Convertir subcarpetas a subfolders para consistencia (recursivo completo)
        const convertSubcarpetas = (subcarpetas: any[]): SubfolderData[] => {
          if (!Array.isArray(subcarpetas)) return [];
          return subcarpetas.map(sub => {
            console.log('🔄 Convirtiendo subcarpeta:', sub.name, 'con subcarpetas:', sub.subcarpetas?.length || 0);
            const converted = {
              name: sub.name,
              category: sub.category || 'profesional_independiente',
              _id: sub._id, // ¡IMPORTANTE! Incluir el ID
              subfolders: convertSubcarpetas(sub.subcarpetas || [])
            };
            console.log('✅ Subcarpeta convertida:', converted.name, 'ID:', converted._id, 'con', converted.subfolders.length, 'subcarpetas anidadas');
            return converted;
          });
        };

        setFormData({
          name: folderData.name || folder.name || '',
          description: folder.description || folderData.description || '',
          subfolders: convertSubcarpetas(folderData.subcarpetas || [])
        });
      } else {
        // Fallback: obtener solo subcarpetas directas
        console.log('⚠️ Carpeta no encontrada en jerarquía, obteniendo subcarpetas directas');
        const subResponse = await folderService.getSubfolders(folder._id);
        const subfolders = (subResponse as any).subcarpetas || subResponse || [];
        
        setFormData({
          name: folder.name || '',
          description: folder.description || '',
          subfolders: subfolders.map((sub: any) => ({
            name: sub.name,
            category: sub.category || 'profesional_independiente',
            _id: sub._id, // ¡IMPORTANTE! Incluir el ID
            subfolders: []
          }))
        });
      }
    } catch (error) {
      console.error('Error cargando estructura de carpeta:', error);
      // Usar datos básicos como fallback
      setFormData({
        name: folder.name || '',
        description: folder.description || '',
        subfolders: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para verificar duplicados
  const checkDuplicate = (name: string, subfolders: SubfolderData[]) => {
    if (!Array.isArray(subfolders)) return false;
    return subfolders.some(sub => 
      sub && sub.name && sub.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Función para obtener subcarpetas en una ruta específica
  const getSubfoldersAtPath = (path: string) => {
    if (!path) return formData.subfolders;
    
    const pathArray = path.split('-').map(Number);
    let current = formData.subfolders;
    
    for (let i = 0; i < pathArray.length; i++) {
      if (current && current[pathArray[i]] && current[pathArray[i]].subfolders) {
        current = current[pathArray[i]].subfolders;
      } else {
        console.error('Ruta inválida:', path, 'en índice:', i);
        return [];
      }
    }
    
    return current || [];
  };

  // Mostrar input para editar nombre de subcarpeta
  const showEditName = (path: string) => {
    console.log('🔍 Editando subcarpeta en ruta:', path);
    
    const pathArray = path.split('-').map(Number);
    const parentPath = pathArray.slice(0, -1).join('-');
    const currentSubfolders = getSubfoldersAtPath(parentPath);
    const index = pathArray[pathArray.length - 1];
    
    console.log('📁 Subcarpetas en nivel:', currentSubfolders);
    console.log('📁 Índice a editar:', index);
    console.log('📁 Nombre a editar:', currentSubfolders[index]?.name);
    
    if (currentSubfolders[index]) {
      setEditingPath(path);
      setEditingValue(currentSubfolders[index].name);
    }
  };

  // Mostrar input para subcarpeta anidada
  const showNestedInput = (path: string) => {
    setEditingPath(null);
    setEditingValue('');
    setEditingPath(path);
    setEditingValue('');
  };

  // Guardar subcarpeta anidada
  const saveNestedSubfolder = () => {
    if (!editingPath || !editingValue.trim()) return;

    const trimmedName = editingValue.trim();
    const pathArray = editingPath.split('-').map(Number);
    const parentPath = pathArray.slice(0, -1).join('-');
    const currentSubfolders = getSubfoldersAtPath(parentPath);
    const index = pathArray[pathArray.length - 1];
    
    console.log('💾 Guardando subcarpeta:', {
      editingPath,
      trimmedName,
      pathArray,
      parentPath,
      currentSubfolders,
      index
    });
    
    // Verificar duplicados
    if (checkDuplicate(trimmedName, currentSubfolders)) {
      Alert.alert('Error', 'Ya existe una subcarpeta con ese nombre');
      return;
    }

    const newSubfolder: SubfolderData = {
      name: trimmedName,
      category: 'profesional_independiente',
      subfolders: []
    };

    // Actualizar el estado de forma segura
    setFormData(prev => {
      const newSubfolders = [...prev.subfolders];
      
      // Función recursiva para actualizar
      const updateSubfolders = (subfolders: SubfolderData[], path: number[]) => {
        if (path.length === 1) {
          const index = path[0];
          if (subfolders[index]) {
            subfolders[index] = {
              ...subfolders[index],
              subfolders: [...(subfolders[index].subfolders || []), newSubfolder]
            };
          }
        } else {
          const [currentIndex, ...remainingPath] = path;
          if (subfolders[currentIndex] && subfolders[currentIndex].subfolders) {
            updateSubfolders(subfolders[currentIndex].subfolders, remainingPath);
          }
        }
      };

      updateSubfolders(newSubfolders, pathArray);
      
      return { ...prev, subfolders: newSubfolders };
    });

    setEditingPath(null);
    setEditingValue('');
  };

  // Guardar edición de nombre (solo estado local, no backend)
  const saveNameEdit = () => {
    if (!editingPath || !editingValue.trim()) return;

    const trimmedName = editingValue.trim();
    const pathArray = editingPath.split('-').map(Number);
    const parentPath = pathArray.slice(0, -1).join('-');
    const currentSubfolders = getSubfoldersAtPath(parentPath);
    const index = pathArray[pathArray.length - 1];
    
    console.log('💾 Guardando edición:', {
      editingPath,
      trimmedName,
      pathArray,
      parentPath,
      currentSubfolders,
      index
    });
    
    // Verificar duplicados excluyendo el elemento actual
    const otherSubfolders = currentSubfolders.filter((_, i) => i !== index);
    if (checkDuplicate(trimmedName, otherSubfolders)) {
      Alert.alert('Error', 'Ya existe una subcarpeta con ese nombre');
      return;
    }

    // Solo actualizar estado local (no backend hasta guardar cambios)
    setFormData(prev => {
      const newSubfolders = [...prev.subfolders];
      
      const updateSubfolders = (subfolders: SubfolderData[], path: number[]) => {
        if (path.length === 1) {
          const index = path[0];
          if (subfolders[index]) {
            subfolders[index] = {
              ...subfolders[index],
              name: trimmedName
            };
          }
        } else {
          const [currentIndex, ...remainingPath] = path;
          if (subfolders[currentIndex] && subfolders[currentIndex].subfolders) {
            updateSubfolders(subfolders[currentIndex].subfolders, remainingPath);
          }
        }
      };

      updateSubfolders(newSubfolders, pathArray);
      
      return { ...prev, subfolders: newSubfolders };
    });

    setEditingPath(null);
    setEditingValue('');
    console.log('✅ Edición local completada (pendiente de guardar)');
  };

  // Cancelar edición
  const cancelEditing = () => {
    setEditingPath(null);
    setEditingValue('');
  };

  // Toggle expansión de carpeta
  const toggleFolderExpansion = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Eliminar subcarpeta anidada
  const removeNestedSubfolder = (path: string) => {
    const pathArray = path.split('-').map(Number);
    
    setFormData(prev => {
      const newSubfolders = [...prev.subfolders];
      
      const removeFromSubfolders = (subfolders: SubfolderData[], path: number[]) => {
        if (path.length === 1) {
          const index = path[0];
          subfolders.splice(index, 1);
        } else {
          const [currentIndex, ...remainingPath] = path;
          if (subfolders[currentIndex] && subfolders[currentIndex].subfolders) {
            removeFromSubfolders(subfolders[currentIndex].subfolders, remainingPath);
          }
        }
      };

      removeFromSubfolders(newSubfolders, pathArray);
      
      return { ...prev, subfolders: newSubfolders };
    });
  };

  // Renderizar subcarpetas de forma recursiva
  const renderSubfolders = (subfolders: SubfolderData[], level = 0, parentPath = '') => {
    if (!Array.isArray(subfolders) || subfolders.length === 0) {
      return null;
    }

    return subfolders.map((subfolder, index) => {
      if (!subfolder || typeof subfolder !== 'object' || !subfolder.name) {
        return null;
      }

      const currentPath = parentPath ? `${parentPath}-${index}` : `${index}`;
      const isEditing = editingPath === currentPath;

      const hasSubfolders = Array.isArray(subfolder.subfolders) && subfolder.subfolders.length > 0;
      const isExpanded = expandedFolders.has(currentPath);

      return (
        <View key={`${level}-${index}-${subfolder.name}`} style={level > 0 ? styles.nestedSubfolderContainerIndented : styles.nestedSubfolderContainer}>
          <View style={level > 0 ? styles.nestedSubfolderItemIndented : styles.nestedSubfolderItem}>
            <TouchableOpacity 
              style={styles.nestedSubfolderInfo}
              onPress={() => hasSubfolders && toggleFolderExpansion(currentPath)}
              disabled={!hasSubfolders}
            >
              <Ionicons name="folder" size={18} color="#FF9500" />
              <Text style={styles.nestedSubfolderName}>{subfolder.name}</Text>
              <Text style={styles.nestedSubfolderCount}>
                {hasSubfolders ? subfolder.subfolders.length : 0} subcarpetas
              </Text>
              {hasSubfolders && (
                <Ionicons 
                  name={isExpanded ? "chevron-down" : "chevron-forward"} 
                  size={14} 
                  color="#6c757d" 
                />
              )}
            </TouchableOpacity>
            <View style={styles.nestedSubfolderActions}>
              <TouchableOpacity
                style={styles.nestedEditButton}
                onPress={() => showEditName(currentPath)}
                disabled={isEditing}
              >
                <Ionicons name="create" size={14} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nestedAddButton}
                onPress={() => showNestedInput(currentPath)}
                disabled={isEditing}
              >
                <Ionicons name="add" size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Input para agregar subcarpeta anidada */}
          {isEditing && (
            <View style={styles.nestedInputContainer}>
              <View style={styles.nestedInputRow}>
                <TextInput
                  style={styles.nestedInput}
                  value={editingValue}
                  onChangeText={setEditingValue}
                  placeholder="Nombre de la subcarpeta anidada"
                  autoFocus
                  onSubmitEditing={editingValue ? saveNameEdit : saveNestedSubfolder}
                />
                <TouchableOpacity
                  style={styles.nestedSaveButton}
                  onPress={editingValue ? saveNameEdit : saveNestedSubfolder}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nestedCancelButton}
                  onPress={cancelEditing}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Renderizar subcarpetas anidadas recursivamente solo si está expandida */}
          {isExpanded && hasSubfolders && (
            <View style={styles.nestedSubfoldersContainer}>
              {renderSubfolders(subfolder.subfolders, level + 1, currentPath)}
            </View>
          )}
        </View>
      );
    }).filter(Boolean);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la carpeta');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Actualizando carpeta:', formData);
      
      // Actualizar la carpeta principal
      await folderService.updateFolder(folder._id, {
        name: formData.name,
        descripcion: formData.description
      });
      
      // Actualizar subcarpetas si hay cambios
      if (formData.subfolders.length > 0) {
        console.log('🔄 Actualizando subcarpetas:', formData.subfolders);
        
        // Función recursiva para actualizar subcarpetas
        const updateSubfoldersRecursively = async (subfolders: SubfolderData[], parentId: string) => {
          for (const subfolder of subfolders) {
            if (subfolder._id) {
              // Actualizar subcarpeta existente
              console.log('🔄 Actualizando subcarpeta:', subfolder.name, subfolder._id);
              await folderService.updateFolder(subfolder._id, {
                name: subfolder.name,
                descripcion: subfolder.name // Usar el nombre como descripción por defecto
              });
            } else {
              // Crear nueva subcarpeta
              console.log('🔄 Creando nueva subcarpeta:', subfolder.name);
              const newSubfolder = await folderService.createFolder({
                name: subfolder.name,
                descripcion: subfolder.name,
                category: subfolder.category,
                parentFolder: parentId
              });
              
              // Actualizar el ID en el estado local
              subfolder._id = newSubfolder._id;
            }
            
            // Actualizar subcarpetas anidadas recursivamente
            if (subfolder.subfolders && subfolder.subfolders.length > 0) {
              await updateSubfoldersRecursively(subfolder.subfolders, subfolder._id);
            }
          }
        };
        
        await updateSubfoldersRecursively(formData.subfolders, folder._id);
      }
      
      console.log('✅ Carpeta y subcarpetas actualizadas exitosamente');
      Alert.alert('Éxito', 'Carpeta actualizada correctamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('❌ Error actualizando carpeta:', error);
      Alert.alert('Error', 'Error al actualizar la carpeta: ' + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando carpeta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar Carpeta</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            {/* Nombre de la carpeta */}
            <View style={styles.section}>
              <Text style={styles.label}>Nombre de la carpeta *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Ej: Documentos Básicos"
              />
            </View>

            {/* Descripción */}
            <View style={styles.section}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Esta carpeta se creó para almacenar archivos relacionados con..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Subcarpetas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subcarpetas</Text>
              <Text style={styles.sectionDescription}>
                Gestiona las subcarpetas de esta carpeta
              </Text>

              {formData.subfolders.length > 0 && (
                <View style={styles.subfoldersList}>
                  <Text style={styles.subfoldersTitle}>
                    Subcarpetas ({formData.subfolders.length})
                  </Text>
                  {renderSubfolders(formData.subfolders, 0)}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelActionButton} onPress={onClose}>
            <Text style={styles.cancelActionText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitActionButton, loading && styles.submitActionButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.submitActionText}>Guardar Cambios</Text>
                <Ionicons name="checkmark" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50, // Más espacio desde arriba
    paddingBottom: 20, // Más espacio hacia abajo
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    minHeight: 48,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  subfoldersList: {
    marginTop: 16,
  },
  subfoldersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: 'white',
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    backgroundColor: 'white',
    marginRight: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  submitActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 12,
    minHeight: 44,
  },
  submitActionButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  // Estilos para subcarpetas anidadas - DISEÑO HERMOSO Y MODERNO
  nestedSubfolderContainer: {
    marginBottom: 8,
    marginLeft: 0,
  },
  nestedSubfolderContainerIndented: {
    marginBottom: 8,
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#e9ecef',
    paddingLeft: 8,
  },
  nestedSubfolderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nestedSubfolderItemIndented: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nestedSubfolderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nestedSubfolderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  nestedSubfolderCount: {
    fontSize: 11,
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '500',
    marginLeft: 8,
  },
  nestedSubfolderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nestedEditButton: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#ffc107',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nestedAddButton: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nestedInputContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  nestedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nestedInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    borderRadius: 10,
    padding: 16,
    fontSize: 18,
    backgroundColor: 'white',
    marginRight: 12,
    minHeight: 48,
  },
  nestedSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  nestedCancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nestedSubfoldersContainer: {
    marginTop: 8,
    paddingLeft: 0,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
  },
});

export default EditarCarpetaAnidada;
