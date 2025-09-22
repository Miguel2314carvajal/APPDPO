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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { folderService } from '../../services/folderService';
import MultiFolderSelector from '../../components/MultiFolderSelector';

interface User {
  _id: string;
  email: string;
  companyName: string;
  maxSessions: number;
  rol: string;
  folders: string[];
}

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  parentFolder?: string | null | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export default function EditarUsuarioScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    maxSessions: 3,
    rol: 'usuario',
    newPassword: '',
  });

  useEffect(() => {
    loadUserAndFolders();
  }, [userId]);

  const loadUserAndFolders = async () => {
    try {
      setIsLoading(true);
      
      // Cargar usuario y carpetas en paralelo
      const [userData, foldersData] = await Promise.all([
        authService.getUserById(userId),
        folderService.listFolders()
      ]);

      setUser(userData);
      setFolders(foldersData);

      // Llenar formulario con datos del usuario
      setFormData({
        email: userData.email || '',
        companyName: userData.companyName || '',
        maxSessions: userData.maxSessions,
        rol: userData.rol || 'usuario',
        newPassword: '',
      });

      // Si el usuario tiene carpetas asignadas, seleccionarlas
      if (userData.folders && userData.folders.length > 0) {
        const userFolders = foldersData.filter(f => userData.folders.includes(f._id));
        setSelectedFolders(userFolders);
      }

    } catch (error: any) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFoldersSelect = (folders: Folder[]) => {
    setSelectedFolders(folders);
  };

  const handleResetPassword = async () => {
    if (!user) return;

    Alert.alert(
      'Restablecer Contraseña',
      `¿Estás seguro de que quieres restablecer la contraseña de ${user.companyName}? Se generará una nueva contraseña temporal y se enviará por email.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              
              const response = await authService.resetUserPassword(user._id);
              
              Alert.alert(
                'Contraseña Restablecida',
                `La nueva contraseña es: ${response.newPassword}\n\nSe ha enviado un email al usuario con esta información.`,
                [{ text: 'OK' }]
              );
              
            } catch (error: any) {
              console.error('Error restableciendo contraseña:', error);
              Alert.alert(
                'Error',
                error.mensaje || 'No se pudo restablecer la contraseña'
              );
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    // Validar campos requeridos
    if (!formData.email || !formData.companyName) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    // Solo validar carpetas para usuarios regulares
    if (formData.rol === 'usuario' && selectedFolders.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos una carpeta para el usuario');
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        ...formData,
        // Solo incluir carpetas para usuarios regulares
        ...(formData.rol === 'usuario' && { folders: selectedFolders.map(folder => folder._id) }),
        // Establecer límite de sesiones automáticamente
        maxSessions: formData.rol === 'usuario' ? 1 : 3
      };

      // Actualizar usuario
      await authService.updateUser(userId, updateData);

      // Si se proporcionó una nueva contraseña, cambiarla por separado
      if (formData.newPassword && formData.newPassword.trim()) {
        await authService.resetUserPassword(userId, formData.newPassword);
      }

      const mainFolders = selectedFolders.filter(folder => !folder.parentFolder);
      const successMessage = formData.rol === 'usuario' 
        ? `Usuario actualizado correctamente con acceso a ${mainFolders.length} carpeta${mainFolders.length !== 1 ? 's' : ''}`
        : 'Usuario actualizado correctamente como administrador';
        
      Alert.alert(
        'Éxito', 
        successMessage,
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
      `¿Estás seguro de que quieres eliminar a ${user.companyName}?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await authService.deleteUser(userId);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      
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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Información del Usuario</Text>
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
          <Text style={styles.inputLabel}>Empresa *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la empresa"
            value={formData.companyName}
            onChangeText={(value) => handleInputChange('companyName', value)}
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


        {/* Gestión de Contraseñas */}
        <View style={styles.sectionHeader}>
          <Ionicons name="key" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Gestión de Contraseñas</Text>
        </View>

        {/* Campo para establecer contraseña manualmente */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nueva Contraseña (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Dejar vacío para mantener la actual"
            value={formData.newPassword || ''}
            onChangeText={(value) => setFormData(prev => ({ ...prev, newPassword: value }))}
            secureTextEntry
            autoCapitalize="none"
          />
          <Text style={styles.inputDescription}>
            Establece una contraseña específica para el usuario
          </Text>
        </View>

        {/* Botón de Restablecer Contraseña Temporal */}
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.resetPasswordButton}
            onPress={handleResetPassword}
            disabled={isSaving}
          >
            <Ionicons name="refresh" size={20} color="#FF6B35" />
            <Text style={styles.resetPasswordText}>Enviar Contraseña Temporal</Text>
          </TouchableOpacity>
          <Text style={styles.resetPasswordDescription}>
            Genera una nueva contraseña temporal y la envía por email al usuario
          </Text>
        </View>

        {/* Asignación de Carpetas - Solo para usuarios regulares */}
        {formData.rol === 'usuario' && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder" size={24} color="#007AFF" />
              <Text style={styles.sectionTitle}>Asignación de Carpetas</Text>
            </View>

            {/* Selector de Carpeta */}
            <View style={styles.folderSelectorContainer}>
              <Text style={styles.inputLabel}>Carpetas Asignadas *</Text>
              <MultiFolderSelector
                selectedFolders={selectedFolders}
                onFoldersSelect={handleFoldersSelect}
                placeholder="Seleccionar carpetas"
              />
            </View>
          </>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Información importante:</Text>
            <Text style={styles.infoText}>
              • Los cambios se aplicarán inmediatamente{'\n'}
              {formData.rol === 'usuario' ? (
                <>
                  • El usuario mantendrá acceso a todas las carpetas seleccionadas{'\n'}
                  • Puedes seleccionar múltiples carpetas usando los checkboxes{'\n'}
                  • Los usuarios tienen límite de 1 sesión simultánea{'\n'}
                </>
              ) : (
                <>
                  • Los administradores tienen acceso completo al sistema{'\n'}
                  • No necesitan asignación de carpetas específicas{'\n'}
                  • Los administradores tienen límite de 3 sesiones simultáneas{'\n'}
                </>
              )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
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
    flex: 1,
  },
  formContainer: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  sessionSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sessionOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  selectedSession: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  sessionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectedSessionText: {
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
  inputDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 16,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  resetPasswordButton: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B35',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resetPasswordText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetPasswordDescription: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
