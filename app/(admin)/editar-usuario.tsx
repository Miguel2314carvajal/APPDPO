import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { folderService } from '../../services/folderService';
import FolderSelector from '../../components/FolderSelector';

interface User {
  _id: string;
  nombres: string;
  apellidos: string;
  email: string;
  cedula: string;
  telefono: string;
  direccion: string;
  rol: string;
  folders: string[];
}

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  createdAt: string;
  updatedAt: string;
}

export default function EditarUsuarioScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cedula } = route.params as { cedula: string };

  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    cedula: '',
    telefono: '',
    direccion: '',
    rol: 'usuario',
  });

  useEffect(() => {
    loadUserAndFolders();
  }, [cedula]);

  const loadUserAndFolders = async () => {
    try {
      setIsLoading(true);
      
      // Cargar usuario y carpetas en paralelo
      const [userData, foldersData] = await Promise.all([
        authService.getUserByCedula(cedula),
        folderService.listFolders()
      ]);

      setUser(userData);
      setFolders(foldersData);

      // Llenar formulario con datos del usuario
      setFormData({
        nombres: userData.nombres || '',
        apellidos: userData.apellidos || '',
        email: userData.email || '',
        cedula: userData.cedula || '',
        telefono: userData.telefono || '',
        direccion: userData.direccion || '',
        rol: userData.rol || 'usuario',
      });

      // Si el usuario tiene carpetas asignadas, seleccionar la primera
      if (userData.folders && userData.folders.length > 0) {
        const userFolder = foldersData.find(f => f._id === userData.folders[0]);
        if (userFolder) {
          setSelectedFolder(userFolder);
        }
      }

    } catch (error: any) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFolderSelect = (folder: Folder) => {
    setSelectedFolder(folder);
  };

  const handleSave = async () => {
    // Validar campos requeridos
    if (!formData.nombres || !formData.apellidos || !formData.email || 
        !formData.cedula || !formData.telefono || !formData.direccion) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (!selectedFolder) {
      Alert.alert('Error', 'Debes seleccionar una carpeta para el usuario');
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        ...formData,
        carpetaId: selectedFolder._id
      };

      await authService.updateUser(cedula, updateData);

      Alert.alert(
        'Éxito', 
        'Usuario actualizado correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      const errorMessage = error.response?.data?.msg || 'Error al actualizar el usuario';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user) return;

    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar a ${user.nombres} ${user.apellidos}?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await authService.deleteUser(cedula);
              Alert.alert(
                'Éxito', 
                'Usuario eliminado correctamente',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error: any) {
              console.error('Error eliminando usuario:', error);
              const errorMessage = error.response?.data?.msg || 'Error al eliminar el usuario';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsSaving(false);
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
        <Text style={styles.loadingText}>Cargando datos del usuario...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Usuario no encontrado</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="person" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Editar Usuario</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Información del Usuario</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nombres *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa los nombres"
            value={formData.nombres}
            onChangeText={(value) => handleInputChange('nombres', value)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Apellidos *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa los apellidos"
            value={formData.apellidos}
            onChangeText={(value) => handleInputChange('apellidos', value)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Número de cédula *</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Número de cédula"
            value={formData.cedula}
            editable={false}
          />
          <Text style={styles.disabledNote}>La cédula no se puede modificar</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Número de teléfono *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 0987654321"
            value={formData.telefono}
            onChangeText={(value) => handleInputChange('telefono', value)}
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Correo electrónico *</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@email.com"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Dirección completa *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ingresa la dirección completa"
            value={formData.direccion}
            onChangeText={(value) => handleInputChange('direccion', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="shield" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Configuración de Acceso</Text>
        </View>

        {/* Selector de Rol */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Rol del usuario</Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                formData.rol === 'usuario' && styles.selectedRole
              ]}
              onPress={() => handleInputChange('rol', 'usuario')}
            >
              <Ionicons 
                name="person" 
                size={20} 
                color={formData.rol === 'usuario' ? '#007AFF' : '#666'} 
              />
              <Text style={[
                styles.roleText,
                formData.rol === 'usuario' && styles.selectedRoleText
              ]}>
                Usuario
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleOption,
                formData.rol === 'admin' && styles.selectedRole
              ]}
              onPress={() => handleInputChange('rol', 'admin')}
            >
              <Ionicons 
                name="shield" 
                size={20} 
                color={formData.rol === 'admin' ? '#007AFF' : '#666'} 
              />
              <Text style={[
                styles.roleText,
                formData.rol === 'admin' && styles.selectedRoleText
              ]}>
                Administrador
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="folder" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Asignación de Carpeta</Text>
        </View>

        {/* Selector de Carpeta */}
        <View style={styles.folderSelectorContainer}>
          <Text style={styles.inputLabel}>Carpeta Asignada *</Text>
          <FolderSelector
            selectedFolder={selectedFolder}
            onFolderSelect={handleFolderSelect}
            placeholder="Seleccionar carpeta"
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Información importante:</Text>
            <Text style={styles.infoText}>
              • Los cambios se aplicarán inmediatamente{'\n'}
              • El usuario mantendrá acceso a la carpeta seleccionada{'\n'}
              • La cédula no se puede modificar por seguridad
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.saveButtonText}>Guardando...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isSaving && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={isSaving}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.deleteButtonText}>Eliminar Usuario</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  formContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  disabledNote: {
    marginTop: 4,
    fontSize: 12,
    color: '#888',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  selectedRole: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  selectedRoleText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  folderSelectorContainer: {
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: 8,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoText: {
    color: '#1976D2',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
