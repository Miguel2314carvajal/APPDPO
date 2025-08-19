import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import FolderSelector from '../../components/FolderSelector';

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
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    carpetaId: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFolderSelect = (folder: Folder) => {
    setSelectedFolder(folder);
    setFormData(prev => ({ ...prev, carpetaId: folder._id }));
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.nombres || !formData.apellidos || !formData.cedula || 
        !formData.telefono || !formData.email || !formData.direccion || !formData.carpetaId) {
      Alert.alert('Error', 'Todos los campos son obligatorios, incluyendo la carpeta');
      return;
    }

    setLoading(true);
    try {
      await authService.createUser(formData);
      Alert.alert(
        'Éxito', 
        'Usuario creado correctamente. Se enviará un email con las credenciales temporales.',
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
          <Ionicons name="person" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Crear Nuevo Usuario</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Información del Usuario</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Ingresa los nombres *"
          value={formData.nombres}
          onChangeText={(value) => handleInputChange('nombres', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Ingresa los apellidos *"
          value={formData.apellidos}
          onChangeText={(value) => handleInputChange('apellidos', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Número de cédula *"
          value={formData.cedula}
          onChangeText={(value) => handleInputChange('cedula', value)}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Número de teléfono *"
          value={formData.telefono}
          onChangeText={(value) => handleInputChange('telefono', value)}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="tu@email.com *"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Dirección completa *"
          value={formData.direccion}
          onChangeText={(value) => handleInputChange('direccion', value)}
          multiline
          numberOfLines={2}
        />

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
          <Text style={styles.infoText}>
            • El usuario recibirá un email con credenciales temporales{'\n'}
            • Se le asignará acceso solo a la carpeta seleccionada
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creando Usuario...' : 'Crear Usuario'}
          </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  folderSelectorContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
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
  infoText: {
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
