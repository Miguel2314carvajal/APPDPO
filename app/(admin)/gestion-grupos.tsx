import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { groupService, Group } from '../../services/groupService';
import { authService } from '../../services/authService';

export default function GestionGruposScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadGroups();
  }, []);

  // Recargar automáticamente cuando la pantalla vuelva a tener foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 Pantalla enfocada, recargando grupos...');
      loadGroups();
    }, [])
  );

  const loadGroups = async () => {
    try {
      console.log('🔄 Cargando grupos...');
      setIsLoading(true);
      const groupsData = await groupService.getGroups();
      console.log('✅ Grupos cargados:', groupsData.length);
      setGroups(groupsData);
    } catch (error: any) {
      console.error('❌ Error cargando grupos:', error);
      Alert.alert('Error', 'No se pudieron cargar los grupos');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGroups = async () => {
    setIsRefreshing(true);
    await loadGroups();
    setIsRefreshing(false);
  };

  const handleDeleteGroup = async (group: Group) => {
    Alert.alert(
      'Eliminar Grupo',
      `¿Estás seguro de que quieres eliminar el grupo "${group.name}"?\n\nEsta acción eliminará el grupo y removerá a todos los usuarios del mismo.\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(group._id);
              await groupService.deleteGroup(group._id);
              Alert.alert('Éxito', 'Grupo eliminado correctamente');
              await loadGroups(); // Recargar la lista
            } catch (error: any) {
              console.error('Error eliminando grupo:', error);
              Alert.alert('Error', 'No se pudo eliminar el grupo');
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
  };

  const openGroup = (group: Group) => {
    (navigation as any).navigate('DetalleGrupo', { groupId: group._id, groupName: group.name });
  };

  const createNewGroup = () => {
    (navigation as any).navigate('NuevoGrupo');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profesional_independiente':
        return 'briefcase';
      case 'transporte_escolar':
        return 'school';
      case 'encargador_seguros':
        return 'shield';
      default:
        return 'people';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profesional_independiente':
        return '#3498db';
      case 'transporte_escolar':
        return '#e74c3c';
      case 'encargador_seguros':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'profesional_independiente':
        return 'Profesional Independiente';
      case 'transporte_escolar':
        return 'Transporte Escolar';
      case 'encargador_seguros':
        return 'Encargador de Seguros';
      default:
        return 'Sin categoría';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando grupos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="people" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Gestión de Grupos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={createNewGroup}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshGroups} />
        }
      >
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No hay grupos</Text>
            <Text style={styles.emptyStateText}>
              Crea tu primer grupo para organizar usuarios y gestionar límites de sesiones
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={createNewGroup}>
              <Text style={styles.emptyStateButtonText}>Crear Primer Grupo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <View key={group._id} style={styles.groupCard}>
                <TouchableOpacity 
                  style={styles.groupContent}
                  onPress={() => openGroup(group)}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupIconContainer}>
                      <Ionicons 
                        name={getCategoryIcon(group.category)} 
                        size={32} 
                        color={getCategoryColor(group.category)} 
                      />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupCategory}>
                        {getCategoryName(group.category)}
                      </Text>
                      {group.description && (
                        <Text style={styles.groupDescription} numberOfLines={2}>
                          {group.description}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  </View>
                  
                  <View style={styles.groupStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="people" size={16} color="#3498db" />
                      <Text style={styles.statText}>{group.users.length} usuarios</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={16} color="#e74c3c" />
                      <Text style={styles.statText}>{group.maxSessions} sesiones</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="calendar" size={16} color="#95a5a6" />
                      <Text style={styles.statText}>
                        {new Date(group.createdAt).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.groupActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => (navigation as any).navigate('EditarGrupo', { groupId: group._id })}
                  >
                    <Ionicons name="create" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteGroup(group)}
                    disabled={isDeleting === group._id}
                  >
                    {isDeleting === group._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="trash" size={18} color="white" />
                        <Text style={styles.actionButtonText}>Eliminar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  groupsList: {
    padding: 20,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  groupContent: {
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  groupCategory: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  groupActions: {
    flexDirection: 'row',
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
