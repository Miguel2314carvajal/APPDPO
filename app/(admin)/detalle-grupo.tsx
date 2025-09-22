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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { groupService, Group } from '../../services/groupService';

export default function DetalleGrupoScreen() {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, groupName } = route.params as { groupId: string; groupName: string };

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      console.log('🔄 Cargando grupo:', groupId);
      setIsLoading(true);
      const groupData = await groupService.getGroup(groupId);
      console.log('✅ Grupo cargado:', groupData);
      setGroup(groupData);
    } catch (error: any) {
      console.error('❌ Error cargando grupo:', error);
      Alert.alert('Error', 'No se pudo cargar el grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGroup = async () => {
    setIsRefreshing(true);
    await loadGroup();
    setIsRefreshing(false);
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
          <Text style={styles.loadingText}>Cargando grupo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>No se pudo cargar el grupo</Text>
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
          <Ionicons name="layers" size={24} color="#9B59B6" />
          <Text style={styles.headerTitle}>{group.name}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshGroup} />
        }
      >
        {/* Información del Grupo */}
        <View style={styles.groupInfoCard}>
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
                <Text style={styles.groupDescription}>{group.description}</Text>
              )}
            </View>
          </View>

          <View style={styles.groupStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="#3498db" />
              <Text style={styles.statLabel}>Usuarios</Text>
              <Text style={styles.statValue}>{group.users.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#e74c3c" />
              <Text style={styles.statLabel}>Sesiones</Text>
              <Text style={styles.statValue}>{group.maxSessions}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={20} color="#95a5a6" />
              <Text style={styles.statLabel}>Creado</Text>
              <Text style={styles.statValue}>
                {new Date(group.createdAt).toLocaleDateString('es-ES')}
              </Text>
            </View>
          </View>
        </View>

        {/* Usuarios del Grupo */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Usuarios del Grupo</Text>
            <Text style={styles.sectionSubtitle}>
              {group.users.length} usuario{group.users.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {group.users.length === 0 ? (
            <View style={styles.emptyUsersContainer}>
              <Ionicons name="people-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyUsersTitle}>Sin usuarios</Text>
              <Text style={styles.emptyUsersText}>
                Este grupo no tiene usuarios asignados
              </Text>
            </View>
          ) : (
            <View style={styles.usersList}>
              {group.users.map((user, index) => (
                <View key={user._id} style={styles.userItem}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {user.companyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.companyName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userCategory}>
                      {getCategoryName(user.category)}
                    </Text>
                  </View>
                  <View style={styles.userNumber}>
                    <Text style={styles.userNumberText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Información sobre límites de sesiones */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            Este grupo tiene un límite de {group.maxSessions} sesión{group.maxSessions !== 1 ? 'es' : ''} simultáneas, 
            calculado automáticamente basado en el número de usuarios ({group.users.length}).
          </Text>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
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
  content: {
    flex: 1,
  },
  groupInfoCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  groupIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  groupCategory: {
    fontSize: 16,
    color: '#9B59B6',
    fontWeight: '600',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  usersSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyUsersContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyUsersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyUsersText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  usersList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  userCategory: {
    fontSize: 12,
    color: '#95a5a6',
  },
  userNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    margin: 20,
    marginTop: 0,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
