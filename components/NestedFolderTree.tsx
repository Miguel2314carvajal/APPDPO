import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FolderData {
  _id: string;
  name: string;
  files?: any[];
  subfolders?: FolderData[];
  [key: string]: any;
}

interface NestedFolderTreeProps {
  folders: FolderData[];
  onEdit: (folder: FolderData) => void;
  onDelete: (folder: FolderData) => void;
  level?: number;
}

const NestedFolderTree: React.FC<NestedFolderTreeProps> = ({ 
  folders, 
  onEdit, 
  onDelete, 
  level = 0 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolder = (folder: FolderData) => {
    try {
      const isExpanded = expandedFolders.has(folder._id);
      const hasSubfolders = folder.subfolders && Array.isArray(folder.subfolders) && folder.subfolders.length > 0;
      const indentLevel = level * 20;

      return (
        <View key={folder._id} style={styles.folderContainer}>
          <View style={[styles.folderItem, { marginLeft: indentLevel }]}>
            <View style={styles.folderContent}>
              <View style={styles.folderInfo}>
                <View style={styles.expandIcon} />
                
                <Ionicons
                  name="folder"
                  size={20}
                  color="#FF9500"
                  style={styles.folderIcon}
                />
                
                <View style={styles.folderDetails}>
                  <Text style={styles.folderName}>{folder.name || 'Carpeta sin nombre'}</Text>
                  <Text style={styles.folderMeta}>
                    {Array.isArray(folder.files) ? folder.files.length : 0} archivos • {folder.subfoldersCount || 0} subcarpetas
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.folderActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => onEdit && onEdit(folder)}
              >
                <Ionicons name="create" size={16} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete && onDelete(folder)}
              >
                <Ionicons name="trash" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      );
    } catch (error) {
      console.error('Error renderizando carpeta:', error, folder);
      return (
        <View key={folder._id || 'error'} style={styles.folderContainer}>
          <Text style={styles.errorText}>Error al mostrar carpeta</Text>
        </View>
      );
    }
  };

  // Validar que folders sea un array válido
  if (!folders || !Array.isArray(folders)) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay carpetas disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {folders.map((folder, index) => {
        // Validar que cada folder tenga las propiedades necesarias
        if (!folder || !folder._id || !folder.name) {
          return null;
        }
        return renderFolder(folder);
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  folderContainer: {
    marginBottom: 4,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  folderContent: {
    flex: 1,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandIcon: {
    width: 16,
    marginRight: 8,
  },
  folderIcon: {
    marginRight: 8,
  },
  folderDetails: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  folderMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  folderActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  subfoldersContainer: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
});

export default NestedFolderTree;