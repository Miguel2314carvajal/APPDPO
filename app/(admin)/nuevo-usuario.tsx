import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/authService';

export default function NuevoUsuarioScreen() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['nombres', 'apellidos', 'cedula', 'telefono', 'email', 'direccion'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData].trim());
    
    if (emptyFields.length > 0) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    // Validar cédula (mínimo 8 dígitos)
    if (formData.cedula.length < 8) {
      Alert.alert('Error', 'La cédula debe tener al menos 8 dígitos');
      return false;
    }

    // Validar teléfono (mínimo 7 dígitos)
    if (formData.telefono.length < 7) {
      Alert.alert('Error', 'El teléfono debe tener al menos 7 dígitos');
      return false;
    }

    return true;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      // Crear usuario con el backend
      const response = await authService.registerUser({
        ...formData,
        folders: [] // Por defecto sin carpetas asignadas
      });
      
      Alert.alert(
        '¡Éxito!',
        'Usuario creado correctamente. Se enviará un email con las credenciales temporales.',
        [
          {
            text: 'Crear Otro Usuario',
            onPress: () => {
              // Limpiar formulario
              setFormData({
                nombres: '',
                apellidos: '',
                cedula: '',
                telefono: '',
                email: '',
                direccion: ''
              });
            }
          },
          {
            text: 'Volver a Usuarios',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      Alert.alert(
        'Error de Creación',
        error.mensaje || 'Error al crear usuario. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 Crear Nuevo Usuario</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Información del Usuario</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombres *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa los nombres"
              value={formData.nombres}
              onChangeText={(value) => handleInputChange('nombres', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellidos *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa los apellidos"
              value={formData.apellidos}
              onChangeText={(value) => handleInputChange('apellidos', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cédula *</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de cédula"
              value={formData.cedula}
              onChangeText={(value) => handleInputChange('cedula', value)}
              keyboardType="numeric"
              maxLength={15}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de teléfono"
              value={formData.telefono}
              onChangeText={(value) => handleInputChange('telefono', value)}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección *</Text>
            <TextInput
              style={styles.input}
              placeholder="Dirección completa"
              value={formData.direccion}
              onChangeText={(value) => handleInputChange('direccion', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Información adicional */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ Información Importante</Text>
            <Text style={styles.infoText}>
              • El usuario recibirá un email con credenciales temporales{'\n'}
              • Deberá cambiar su contraseña en su primera sesión{'\n'}
              • Por defecto tendrá rol de "Usuario"{'\n'}
              • No tendrá carpetas asignadas inicialmente
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleBack}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateUser}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>Crear Usuario</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#3498db',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 48,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7f8c8d',
  },
  createButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
