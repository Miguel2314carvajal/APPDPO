import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { folderService } from '../services/folderService';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  parentFolder?: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface FolderSelectorProps {
  selectedFolder: Folder | null;
  onFolderSelect: (folder: Folder) => void;
  placeholder?: string;
}

export default function FolderSelector({ 
  selectedFolder, 
  onFolderSelect, 
  placeholder = "Seleccionar carpeta" 
}: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const data = await folderService.listFolders();
      // Filtrar solo carpetas principales (sin parentFolder)
      const mainFolders = data.filter((folder: any) => !folder.parentFolder);
      setFolders(mainFolders || []);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderSelect = (folder: Folder) => {
    onFolderSelect(folder);
    setIsModalVisible(false);
    setSearchText('');
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const openModal = () => {
    setIsModalVisible(true);
    setSearchText('');
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSearchText('');
  };

  return (
    <>
      {/* Botón del selector */}
      <TouchableOpacity style={styles.selectorButton} onPress={openModal}>
        {selectedFolder ? (
          <View style={styles.selectedFolderContainer}>
            <Ionicons name="folder" size={20} color="#007AFF" />
            <Text style={styles.selectedFolderText}>{selectedFolder.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {/* Modal del selector */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Carpeta</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar carpeta..."
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista de carpetas */}
            <FlatList
              data={filteredFolders}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.folderItem}
                  onPress={() => handleFolderSelect(item)}
                >
                  <Ionicons name="folder" size={24} color="#007AFF" />
                  <View style={styles.folderInfo}>
                    <Text style={styles.folderName}>{item.name}</Text>
                    <Text style={styles.folderDetails}>
                      {item.files?.length || 0} archivos
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              )}
              style={styles.folderList}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {folders.length === 0 
                      ? 'No hay carpetas disponibles' 
                      : 'No se encontraron carpetas'
                    }
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {folders.length === 0 
                      ? 'Crea carpetas desde "Gestionar Carpetas"' 
                      : 'Intenta con otro término de búsqueda'
                    }
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  selectedFolderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedFolderText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
    marginLeft: 8,
  },
  folderList: {
    maxHeight: 400,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  folderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  folderDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
