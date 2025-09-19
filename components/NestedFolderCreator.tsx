import React, { useState } from 'react';
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
  subfolders: SubfolderData[];
}

interface NestedFolderCreatorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const NestedFolderCreator: React.FC<NestedFolderCreatorProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'profesional_independiente' as 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros',
    subfolders: [] as SubfolderData[],
  });
  const [loading, setLoading] = useState(false);
  const [editingSubfolder, setEditingSubfolder] = useState<number | null>(null);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const categories = [
    { value: 'profesional_independiente', label: 'Profesional Independiente', icon: 'person' },
    { value: 'transporte_escolar', label: 'Transporte Escolar', icon: 'bus' },
    { value: 'encargador_seguros', label: 'Encargador de Seguros', icon: 'shield-checkmark' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para verificar duplicados en un array específico
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
    
    // Navegar hasta el nivel correcto
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

  const handleAddSubfolder = () => {
    const trimmedName = newSubfolderName.trim();
    
    if (!trimmedName) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la subcarpeta');
      return;
    }

    // Verificar duplicados
    if (checkDuplicate(trimmedName, formData.subfolders)) {
      Alert.alert('Error', 'Ya existe una subcarpeta con ese nombre');
      setNewSubfolderName('');
      return;
    }

    const newSubfolder: SubfolderData = {
      name: trimmedName,
      category: formData.category,
      subfolders: []
    };

    setFormData(prev => ({
      ...prev,
      subfolders: [...prev.subfolders, newSubfolder]
    }));
    setNewSubfolderName('');
  };

  const handleEditSubfolder = (index: number) => {
    setEditingSubfolder(index);
    setNewSubfolderName(formData.subfolders[index].name);
  };

  const handleSaveSubfolderEdit = (index: number) => {
    if (!newSubfolderName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la subcarpeta');
      return;
    }

    setFormData(prev => ({
      ...prev,
      subfolders: prev.subfolders.map((subfolder, i) => 
        i === index ? { ...subfolder, name: newSubfolderName.trim() } : subfolder
      )
    }));
    setEditingSubfolder(null);
    setNewSubfolderName('');
  };

  const handleDeleteSubfolder = (index: number) => {
    Alert.alert(
      'Eliminar Subcarpeta',
      '¿Estás seguro de que quieres eliminar esta subcarpeta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              subfolders: prev.subfolders.filter((_, i) => i !== index)
            }));
          }
        }
      ]
    );
  };

  // Mostrar input para subcarpeta anidada
  const showNestedInput = (path: string) => {
    // Cerrar cualquier input activo
    setEditingPath(null);
    setEditingValue('');
    
    // Mostrar nuevo input
    setEditingPath(path);
    setEditingValue('');
  };

  // Guardar subcarpeta anidada
  const saveNestedSubfolder = () => {
    if (!editingPath || !editingValue.trim()) return;

    const trimmedName = editingValue.trim();
    console.log('🔍 Verificando subcarpeta anidada:', trimmedName, 'en ruta:', editingPath);

    // Obtener las subcarpetas en el nivel correcto
    const currentSubfolders = getSubfoldersAtPath(editingPath);
    console.log('📁 Subcarpetas existentes en este nivel:', currentSubfolders.map(s => s.name));
    
    // Verificar duplicados ANTES de hacer cualquier cambio
    if (checkDuplicate(trimmedName, currentSubfolders)) {
      console.log('❌ Subcarpeta anidada duplicada encontrada');
      Alert.alert('Error', 'Ya existe una subcarpeta con ese nombre');
      return;
    }

    console.log('✅ Creando subcarpeta anidada:', trimmedName);

    const newSubfolder: SubfolderData = {
      name: trimmedName,
      category: formData.category,
      subfolders: []
    };

    // Actualizar el estado de forma segura
    setFormData(prev => {
      const newSubfolders = [...prev.subfolders];
      
      if (!editingPath) {
        // Agregar al nivel principal
        newSubfolders.push(newSubfolder);
      } else {
        // Agregar al nivel anidado
        const pathArray = editingPath.split('-').map(Number);
        
        // Verificar nuevamente en el estado actual
        let currentSubfoldersInState = newSubfolders;
        for (let i = 0; i < pathArray.length; i++) {
          if (currentSubfoldersInState && currentSubfoldersInState[pathArray[i]] && currentSubfoldersInState[pathArray[i]].subfolders) {
            currentSubfoldersInState = currentSubfoldersInState[pathArray[i]].subfolders;
          } else {
            console.error('Ruta inválida en estado actual:', editingPath);
            return prev;
          }
        }

        // Verificar duplicados en el estado actual
        if (checkDuplicate(trimmedName, currentSubfoldersInState)) {
          console.log('❌ Duplicado encontrado en estado actual');
          return prev; // No hacer cambios
        }
        
        // Función recursiva para actualizar
        const updateSubfolders = (subfolders: SubfolderData[], path: number[]) => {
          if (path.length === 1) {
            // Estamos en el nivel correcto
            const index = path[0];
            if (subfolders[index]) {
              subfolders[index] = {
                ...subfolders[index],
                subfolders: [...(subfolders[index].subfolders || []), newSubfolder]
              };
            }
          } else {
            // Navegar más profundo
            const [currentIndex, ...remainingPath] = path;
            if (subfolders[currentIndex] && subfolders[currentIndex].subfolders) {
              updateSubfolders(subfolders[currentIndex].subfolders, remainingPath);
            }
          }
        };

        updateSubfolders(newSubfolders, pathArray);
      }
      
      return { ...prev, subfolders: newSubfolders };
    });

    // Cerrar el input
    setEditingPath(null);
    setEditingValue('');
  };

  // Cancelar edición
  const cancelEditing = () => {
    setEditingPath(null);
    setEditingValue('');
  };

  // Eliminar subcarpeta anidada
  const removeNestedSubfolder = (path: string) => {
    const pathArray = path.split('-').map(Number);
    
    setFormData(prev => {
      const newSubfolders = [...prev.subfolders];
      
      // Función recursiva para eliminar
      const removeFromSubfolders = (subfolders: SubfolderData[], path: number[]) => {
        if (path.length === 1) {
          // Estamos en el nivel correcto
          const index = path[0];
          subfolders.splice(index, 1);
        } else {
          // Navegar más profundo
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

      return (
        <View key={`${level}-${index}-${subfolder.name}`} style={styles.nestedSubfolderContainer}>
          <View style={styles.nestedSubfolderItem}>
            <View style={styles.nestedSubfolderInfo}>
              <Ionicons name="folder" size={16} color="#FF9500" />
              <Text style={styles.nestedSubfolderName}>{subfolder.name}</Text>
              <Text style={styles.nestedSubfolderCount}>
                ({Array.isArray(subfolder.subfolders) ? subfolder.subfolders.length : 0} subcarpetas)
              </Text>
            </View>
            <View style={styles.nestedSubfolderActions}>
              <TouchableOpacity
                style={styles.nestedAddButton}
                onPress={() => showNestedInput(currentPath)}
                disabled={isEditing}
              >
                <Ionicons name="add" size={16} color="#34C759" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nestedDeleteButton}
                onPress={() => removeNestedSubfolder(currentPath)}
              >
                <Ionicons name="trash" size={16} color="#FF3B30" />
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
                  onSubmitEditing={saveNestedSubfolder}
                />
                <TouchableOpacity
                  style={styles.nestedSaveButton}
                  onPress={saveNestedSubfolder}
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

          {/* Renderizar subcarpetas anidadas recursivamente */}
          {Array.isArray(subfolder.subfolders) && subfolder.subfolders.length > 0 && (
            <View style={styles.nestedSubfoldersContainer}>
              {renderSubfolders(subfolder.subfolders, level + 1, currentPath)}
            </View>
          )}
        </View>
      );
    }).filter(Boolean);
  };

  // Función recursiva para mapear subcarpetas anidadas
  const mapSubfoldersRecursively = (subfolders: SubfolderData[]): any[] => {
    return subfolders.map(sub => ({
      name: sub.name,
      category: sub.category as 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros',
      subfolders: sub.subfolders && sub.subfolders.length > 0 
        ? mapSubfoldersRecursively(sub.subfolders) 
        : []
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la carpeta');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Creando carpeta anidada:', formData);
      
      // Mapear recursivamente todas las subcarpetas anidadas
      const mappedSubfolders = mapSubfoldersRecursively(formData.subfolders);
      console.log('📁 Subcarpetas mapeadas recursivamente:', mappedSubfolders);
      
      await folderService.createNestedFolder({
        ...formData,
        subfolders: mappedSubfolders
      });
      
      console.log('✅ Carpeta creada exitosamente');
      Alert.alert('Éxito', 'Carpeta creada exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('❌ Error creando carpeta:', error);
      Alert.alert('Error', 'Error al crear la carpeta: ' + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear Nueva Carpeta</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formContainer}>
          {/* Nombre de la carpeta principal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Principal</Text>
            
            <Text style={styles.label}>Nombre de la carpeta *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Ej: Documentos Básicos"
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    formData.category === category.value && styles.categoryButtonSelected
                  ]}
                  onPress={() => handleInputChange('category', category.value)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={formData.category === category.value ? '#007AFF' : '#666'}
                  />
                  <Text style={[
                    styles.categoryText,
                    formData.category === category.value && styles.categoryTextSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Esta carpeta se creará para almacenar archivos relacionados con..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Subcarpetas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subcarpetas (Opcional)</Text>
                   <Text style={styles.sectionDescription}>
                     Puedes agregar subcarpetas dentro de esta carpeta principal y también subcarpetas dentro de las subcarpetas (anidamiento infinito).
                   </Text>

            <View style={styles.addSubfolderContainer}>
              <TextInput
                style={[styles.input, styles.subfolderInput]}
                value={newSubfolderName}
                onChangeText={setNewSubfolderName}
                placeholder="Nombre de la subcarpeta"
                onSubmitEditing={handleAddSubfolder}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddSubfolder}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>

                   {formData.subfolders.length > 0 && (
                     <View style={styles.subfoldersList}>
                       <Text style={styles.subfoldersTitle}>
                         Subcarpetas ({formData.subfolders.length})
                       </Text>
                       {renderSubfolders(formData.subfolders)}
                     </View>
                   )}
          </View>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelActionButton} onPress={onCancel}>
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
              <Text style={styles.submitActionText}>Crear Carpeta</Text>
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
    backgroundColor: 'white',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
    minHeight: 64,
  },
  categoryButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    marginLeft: 16,
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#007AFF',
    fontWeight: '700',
  },
  addSubfolderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subfolderInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subfoldersList: {
    marginTop: 16,
  },
  subfoldersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  subfolderItem: {
    marginBottom: 8,
  },
  subfolderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  subfolderName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1C1C1E',
  },
  subfolderActions: {
    flexDirection: 'row',
  },
  editSubfolderButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteSubfolderButton: {
    padding: 8,
    marginLeft: 4,
  },
  editSubfolderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 6,
    marginRight: 4,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    backgroundColor: 'white',
    alignItems: 'center',
    marginRight: 12,
    minHeight: 44,
  },
  cancelActionText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
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
  // Estilos para subcarpetas anidadas
  nestedSubfolderContainer: {
    marginLeft: 16,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5EA',
    paddingLeft: 12,
  },
  nestedSubfolderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  nestedSubfolderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nestedSubfolderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    flex: 1,
  },
  nestedSubfolderCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  nestedSubfolderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nestedAddButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  nestedDeleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nestedInputContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  nestedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nestedInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: 'white',
    marginRight: 8,
  },
  nestedSaveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  nestedCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nestedSubfoldersContainer: {
    marginTop: 4,
  },
});

export default NestedFolderCreator;