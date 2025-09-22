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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { groupService, Group } from '../../services/groupService';
import { authService, User } from '../../services/authService';

export default function EditarGrupoScreen() {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'profesional_independiente',
    selectedUsers: [] as string[],
  });

  useEffect(() => {
    loadGroup();
    loadUsers();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      console.log('🔄 Cargando grupo:', groupId);
      setIsLoading(true);
      const groupData = await groupService.getGroup(groupId);
      console.log('✅ Grupo cargado:', groupData);
      setGroup(groupData);
      
      // Pre-llenar el formulario
      setFormData({
        name: groupData.name,
        description: groupData.description || '',
        category: groupData.category,
        selectedUsers: groupData.users.map((user: any) => user._id),
      });
    } catch (error: any) {
      console.error('❌ Error cargando grupo:', error);
      Alert.alert('Error', 'No se pudo cargar el grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔄 Cargando usuarios...');
      setIsLoadingUsers(true);
      const response = await authService.listUsers();
      console.log('✅ Respuesta usuarios:', response);
      
      // Manejar diferentes formatos de respuesta del backend
      let usersData = [];
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response && Array.isArray(response.users)) {
        usersData = response.users;
      } else if (response && Array.isArray(response.usuarios)) {
        usersData = response.usuarios;
      } else {
        console.warn('⚠️ Formato de respuesta inesperado:', response);
        usersData = [];
      }
      
      console.log('✅ Usuarios procesados:', usersData.length);
      
      // Filtrar solo usuarios (no administradores)
      const availableUsers = usersData.filter((user: any) => 
        user.rol === 'usuario'
      );
      console.log('✅ Usuarios disponibles:', availableUsers.length);
      setUsers(availableUsers);
    } catch (error: any) {
      console.error('❌ Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del grupo es obligatorio');
      return;
    }

    if (formData.selectedUsers.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos un usuario');
      return;
    }

    try {
      setIsSaving(true);
      console.log('🔄 Actualizando grupo:', formData);
      
      await groupService.updateGroup(groupId, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        users: formData.selectedUsers,
      });

      Alert.alert('Éxito', 'Grupo actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('❌ Error actualizando grupo:', error);
      Alert.alert('Error', 'No se pudo actualizar el grupo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
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

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'profesional_independiente':
        return 'Profesional Independiente';
      case 'transporte_escolar':
        return 'Transporte Escolar';
      case 'encargador_seguros':
        return 'Encargador de Seguros';
      default:
        return 'Otro';
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

  const filteredUsers = users.filter(user =>
    user.companyName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="create" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Editar Grupo</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del Grupo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información del Grupo</Text>
          </View>
          
          <Text style={styles.label}>Nombre del grupo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Equipo de Ventas"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el propósito del grupo..."
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Categoría */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categoría</Text>
          </View>
          
          <View style={styles.categoryContainer}>
            {[
              { key: 'profesional_independiente', name: 'Profesional Independiente', icon: 'briefcase' },
              { key: 'transporte_escolar', name: 'Transporte Escolar', icon: 'school' },
              { key: 'encargador_seguros', name: 'Encargador de Seguros', icon: 'shield' },
            ].map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryOption,
                  formData.category === category.key && styles.categoryOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, category: category.key }))}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={20} 
                  color={formData.category === category.key ? 'white' : getCategoryColor(category.key)} 
                />
                <Text style={[
                  styles.categoryText,
                  formData.category === category.key && styles.categoryTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selección de Usuarios */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Usuarios del Grupo</Text>
          </View>
          
          <TouchableOpacity
            style={styles.userSelectorButton}
            onPress={() => setShowUserSelector(!showUserSelector)}
          >
            <View style={styles.userSelectorContent}>
              <Ionicons name="people" size={20} color="#007AFF" />
              <Text style={styles.userSelectorButtonText} numberOfLines={1}>
                {formData.selectedUsers.length} usuario{formData.selectedUsers.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons 
              name={showUserSelector ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#007AFF" 
            />
          </TouchableOpacity>

          {showUserSelector && (
            <View style={styles.userSelector}>
              {/* Buscador de usuarios */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#95a5a6" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar usuarios..."
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  placeholderTextColor="#95a5a6"
                />
                {userSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setUserSearchQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={16} color="#95a5a6" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Lista de usuarios */}
              {isLoadingUsers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Cargando usuarios...</Text>
                </View>
              ) : filteredUsers.length > 0 ? (
                <ScrollView 
                  style={styles.usersList} 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {filteredUsers.map((user) => (
                    <TouchableOpacity
                      key={user._id}
                      style={[
                        styles.userOption,
                        formData.selectedUsers.includes(user._id) && styles.userOptionSelected
                      ]}
                      onPress={() => handleUserToggle(user._id)}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.companyName}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                      {formData.selectedUsers.includes(user._id) && (
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noUsersContainer}>
                  <Ionicons name="people-outline" size={32} color="#C7C7CC" />
                  <Text style={styles.noUsersText}>No hay usuarios disponibles</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Información sobre límites de sesiones */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            El límite de sesiones se calculará automáticamente basado en el número de usuarios del grupo.
          </Text>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>
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
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 6,
  },
  categoryTextSelected: {
    color: 'white',
  },
  userSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56,
  },
  userSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userSelectorButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  userSelector: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 280,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  usersList: {
    maxHeight: 200,
    paddingVertical: 4,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    minHeight: 60,
  },
  userOptionSelected: {
    backgroundColor: '#e3f2fd',
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
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  noUsersContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noUsersText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
