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
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validar campos requeridos
    const requiredFields = ['nombres', 'apellidos', 'cedula', 'telefono', 'email', 'direccion'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData].trim());
    
    if (emptyFields.length > 0) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    try {
      setIsLoading(true);
      
      // Registrar usuario con el backend
      const response = await authService.registerUser({
        ...formData,
        folders: [] // Por defecto sin carpetas asignadas
      });
      
      // Usar el contexto para mantener la sesión
      await register({
        ...formData,
        folders: []
      });
      
      Alert.alert(
        '¡Éxito!',
        'Usuario registrado correctamente. Se enviará un email con las credenciales.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(admin)')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error en registro:', error);
      Alert.alert(
        'Error de Registro',
        error.mensaje || 'Error al registrar usuario. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>👤 Registrar Usuario</Text>
            <Text style={styles.subtitle}>Crear nueva cuenta de usuario</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.label}>Nombres *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa los nombres"
              value={formData.nombres}
              onChangeText={(value) => handleInputChange('nombres', value)}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Apellidos *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa los apellidos"
              value={formData.apellidos}
              onChangeText={(value) => handleInputChange('apellidos', value)}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Cédula *</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de cédula"
              value={formData.cedula}
              onChangeText={(value) => handleInputChange('cedula', value)}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de teléfono"
              value={formData.telefono}
              onChangeText={(value) => handleInputChange('telefono', value)}
              keyboardType="phone-pad"
            />

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

            <Text style={styles.label}>Dirección *</Text>
            <TextInput
              style={styles.input}
              placeholder="Dirección completa"
              value={formData.direccion}
              onChangeText={(value) => handleInputChange('direccion', value)}
              multiline
              numberOfLines={2}
            />

            {/* Botones */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Registrar Usuario</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleBack}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              * Campos obligatorios
            </Text>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#27ae60',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7f8c8d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
  },
});
