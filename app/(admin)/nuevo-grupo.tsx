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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { groupService, CreateGroupData } from '../../services/groupService';
import { authService } from '../../services/authService';

interface User {
  _id: string;
  email: string;
  companyName: string;
  category: string;
  rol: string;
}

export default function NuevoGrupoScreen() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'profesional_independiente',
    selectedUsers: [] as string[],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const { user: currentUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadUsers();
  }, []);

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
      
      // Filtrar solo usuarios (no administradores) que no estén ya en un grupo
      const availableUsers = usersData.filter((user: any) => 
        user.rol === 'usuario' && !user.group
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
      Alert.alert('Error', 'Debes seleccionar al menos un usuario para el grupo');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Creando grupo:', formData);

      const groupData: CreateGroupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        users: formData.selectedUsers,
        category: formData.category,
      };

      await groupService.createGroup(groupData);

      Alert.alert(
        'Éxito',
        `Grupo "${formData.name}" creado correctamente con ${formData.selectedUsers.length} usuario${formData.selectedUsers.length !== 1 ? 's' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Error creando grupo:', error);
      Alert.alert('Error', error.mensaje || 'No se pudo crear el grupo');
    } finally {
      setIsLoading(false);
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

  const getSelectedUsers = () => {
    return users.filter(user => formData.selectedUsers.includes(user._id));
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

  const filteredUsers = users.filter(user =>
    user.companyName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

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
          <Text style={styles.headerTitle}>Nuevo Grupo</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del Grupo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Grupo</Text>
          
          {/* Nombre del grupo */}
          <Text style={styles.label}>Nombre del grupo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Equipo de Ventas"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          />

          {/* Descripción */}
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el propósito del grupo..."
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />

          {/* Categoría */}
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.categoryContainer}>
            {['profesional_independiente', 'transporte_escolar', 'encargador_seguros'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  formData.category === category && styles.categoryOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, category }))}
              >
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={20}
                  color={formData.category === category ? 'white' : getCategoryColor(category)}
                />
                <Text style={[
                  styles.categoryText,
                  formData.category === category && styles.categoryTextSelected
                ]}>
                  {getCategoryName(category)}
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
                  <Text style={styles.noUsersSubtext}>
                    Todos los usuarios ya están asignados a grupos
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Usuarios seleccionados */}
          {formData.selectedUsers.length > 0 && (
            <View style={styles.selectedUsersContainer}>
              <Text style={styles.selectedUsersTitle}>Usuarios seleccionados:</Text>
              {getSelectedUsers().map((user) => (
                <View key={user._id} style={styles.selectedUserItem}>
                  <Ionicons name="person" size={16} color="#007AFF" />
                  <Text style={styles.selectedUserName}>{user.companyName}</Text>
                  <TouchableOpacity onPress={() => handleUserToggle(user._id)}>
                    <Ionicons name="close-circle" size={16} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Información sobre límites de sesiones */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            El límite de sesiones se calculará automáticamente basado en el número de usuarios del grupo.
            {formData.selectedUsers.length > 0 && (
              ` Este grupo tendrá un límite de ${formData.selectedUsers.length} sesión${formData.selectedUsers.length !== 1 ? 'es' : ''}.`
            )}
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
          disabled={isLoading || formData.selectedUsers.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Crear Grupo</Text>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
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
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  noUsersSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedUsersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedUserName: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
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
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
});
