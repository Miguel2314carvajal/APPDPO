import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { folderService } from '../services/folderService';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  parentFolder?: string | null | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface MultiFolderSelectorProps {
  selectedFolders: Folder[];
  onFoldersSelect: (folders: Folder[]) => void;
  placeholder?: string;
}

export default function MultiFolderSelector({ 
  selectedFolders, 
  onFoldersSelect, 
  placeholder = "Seleccionar carpetas" 
}: MultiFolderSelectorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadFolders();
    }
  }, [isVisible]);

  useEffect(() => {
    console.log('🔄 Actualizando filteredFolders:', folders.length, 'carpetas');
    filterFolders();
  }, [searchQuery, folders]);

  const loadFolders = async () => {
    try {
      console.log('🔄 Iniciando carga de carpetas...');
      setIsLoading(true);
      const foldersData = await folderService.listFolders();
      console.log('✅ Carpetas cargadas:', foldersData);
      console.log('📊 Número de carpetas:', foldersData.length);
      
      // Filtrar solo carpetas principales (sin parentFolder)
      const mainFolders = foldersData.filter((folder: any) => !folder.parentFolder);
      console.log('📁 Carpetas principales:', mainFolders.length);
      console.log('📁 Carpetas principales:', mainFolders.map(f => f.name));
      
      setFolders(mainFolders);
      // Inicializar filteredFolders inmediatamente
      setFilteredFolders(mainFolders);
    } catch (error: any) {
      console.error('❌ Error cargando carpetas:', error);
      if (error.response) {
        console.error('📊 Respuesta del error:', error.response.data);
        console.error('🔢 Status del error:', error.response.status);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterFolders = () => {
    console.log('🔍 Filtrando carpetas. Query:', searchQuery, 'Total carpetas:', folders.length);
    if (!searchQuery.trim()) {
      console.log('📋 Mostrando todas las carpetas:', folders.length);
      setFilteredFolders(folders);
      return;
    }

    const filtered = folders.filter(folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log('🔍 Carpetas filtradas:', filtered.length);
    setFilteredFolders(filtered);
  };

  const toggleFolderSelection = (folder: Folder) => {
    const isSelected = selectedFolders.some(f => f._id === folder._id);
    
    if (isSelected) {
      // Remover carpeta
      const newSelection = selectedFolders.filter(f => f._id !== folder._id);
      onFoldersSelect(newSelection);
    } else {
      // Agregar carpeta
      const newSelection = [...selectedFolders, folder];
      onFoldersSelect(newSelection);
    }
  };

  const isFolderSelected = (folderId: string) => {
    return selectedFolders.some(f => f._id === folderId);
  };

  const getDisplayText = () => {
    const mainFolders = selectedFolders.filter(folder => !folder.parentFolder);
    
    if (mainFolders.length === 0) {
      return placeholder;
    } else if (mainFolders.length === 1) {
      return mainFolders[0].name;
    } else {
      return `${mainFolders.length} carpetas seleccionadas`;
    }
  };

  const renderFolderItem = ({ item }: { item: Folder }) => {
    const isSelected = isFolderSelected(item._id);
    console.log('🎯 Renderizando carpeta:', item.name, 'Seleccionada:', isSelected);
    
    return (
      <TouchableOpacity
        style={[styles.folderItem, isSelected && styles.selectedFolderItem]}
        onPress={() => toggleFolderSelection(item)}
      >
        <View style={styles.folderItemContent}>
          <View style={styles.folderInfo}>
            <Ionicons 
              name="folder" 
              size={20} 
              color={isSelected ? '#007AFF' : '#666'} 
            />
            <View style={styles.folderDetails}>
              <Text style={[styles.folderName, isSelected && styles.selectedFolderName]}>
                {item.name}
              </Text>
              <Text style={styles.folderStats}>
                {item.files?.length || 0} archivos
              </Text>
            </View>
          </View>
          
          <View style={styles.checkboxContainer}>
            {isSelected ? (
              <View style={styles.checkedBox}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            ) : (
              <View style={styles.uncheckedBox} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="folder" size={20} color="#007AFF" />
          <Text style={styles.selectorText}>{getDisplayText()}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Carpetas</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar carpeta..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            <View style={{ flex: 1, minHeight: 300 }}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Cargando carpetas...</Text>
                </View>
              ) : (
                <>
                  {console.log('📋 Renderizando FlatList con', filteredFolders.length, 'carpetas')}
                  <FlatList
                    data={filteredFolders}
                    renderItem={renderFolderItem}
                    keyExtractor={(item) => item._id}
                    style={styles.folderList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>
                          {searchQuery ? 'No se encontraron carpetas' : 'No hay carpetas disponibles'}
                        </Text>
                        <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>
                          Debug: {filteredFolders.length} carpetas en filteredFolders
                        </Text>
                      </View>
                    }
                  />
                </>
              )}
            </View>

            <View style={styles.modalFooter}>
              <View style={styles.selectionInfo}>
                <Text style={styles.selectionText}>
                  {selectedFolders.filter(folder => !folder.parentFolder).length} carpeta{selectedFolders.filter(folder => !folder.parentFolder).length !== 1 ? 's' : ''} seleccionada{selectedFolders.filter(folder => !folder.parentFolder).length !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
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
    width: '100%',
  },
  selector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
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
    margin: 20,
    maxHeight: '80%',
    width: '95%',
    flex: 1, // Asegurar que el modal tenga flex
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  folderList: {
    flex: 1, // Esto es crucial - hacer que la lista tome el espacio disponible
    paddingHorizontal: 16,
    minHeight: 200, // Altura mínima para asegurar visibilidad
  },
  folderItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedFolderItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  folderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  folderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedFolderName: {
    color: '#007AFF',
  },
  folderStats: {
    fontSize: 14,
    color: '#666',
  },
  checkboxContainer: {
    marginLeft: 12,
  },
  checkedBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    flex: 1, // Asegurar que el loading también tenga flex
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    flex: 1, // Asegurar que el empty también tenga flex
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionText: {
    fontSize: 14,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
