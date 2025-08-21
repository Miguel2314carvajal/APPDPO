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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { folderService } from '../../services/folderService';
import MultiFolderSelector from '../../components/MultiFolderSelector';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  createdAt: string;
  updatedAt: string;
}

export default function NuevoUsuarioScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Folder[]>([]);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    carpetaId: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFoldersSelect = (folders: Folder[]) => {
    setSelectedFolders(folders);
    // Mantener carpetaId para compatibilidad con el backend
    if (folders.length > 0) {
      setFormData(prev => ({ ...prev, carpetaId: folders[0]._id }));
    } else {
      setFormData(prev => ({ ...prev, carpetaId: '' }));
    }
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.nombres || !formData.apellidos || !formData.cedula || 
        !formData.telefono || !formData.email || !formData.direccion) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (selectedFolders.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos una carpeta para el usuario');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos con múltiples carpetas
      const userData = {
        ...formData,
        folders: selectedFolders.map(folder => folder._id)
      };

      await authService.registerUser(userData);
      Alert.alert(
        'Éxito', 
        `Usuario creado correctamente con acceso a ${selectedFolders.length} carpeta${selectedFolders.length !== 1 ? 's' : ''}. Se enviará un email con las credenciales temporales.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      const errorMessage = error.response?.data?.mensaje || 'Error al crear el usuario';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <Ionicons name="person-add" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Crear Nuevo Usuario</Text>
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
            style={styles.input}
            placeholder="Ej: 1754864215"
            value={formData.cedula}
            onChangeText={(value) => handleInputChange('cedula', value)}
            keyboardType="numeric"
          />
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

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Información importante:</Text>
            <Text style={styles.infoText}>
              • El usuario recibirá un email con credenciales temporales{'\n'}
              • Se le asignará acceso a todas las carpetas seleccionadas{'\n'}
              • Puedes seleccionar múltiples carpetas usando los checkboxes{'\n'}
              • Podrá cambiar su contraseña después del primer login
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.submitButtonText}>Creando Usuario...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Crear Usuario</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
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
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1976D2',
  },
  infoText: {
    color: '#1976D2',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
