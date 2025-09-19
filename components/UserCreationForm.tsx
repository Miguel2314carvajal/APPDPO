import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';

interface UserCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UserCreationForm({ onSuccess, onCancel }: UserCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    category: 'profesional_independiente' as 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros'
  });

  const categories = [
    { 
      value: 'profesional_independiente', 
      label: 'Profesional Independiente',
      description: 'Consultores, auditores, profesionales independientes'
    },
    { 
      value: 'transporte_escolar', 
      label: 'Transporte Escolar',
      description: 'Empresas de transporte escolar y servicios relacionados'
    },
    { 
      value: 'encargador_seguros', 
      label: 'Encargador de Seguros',
      description: 'Agentes de seguros y corredores'
    }
  ];

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('📝 Creando usuario:', formData);
      
      // Validar campos requeridos
      if (!formData.email || !formData.companyName) {
        Alert.alert('Error', 'Email y Empresa son obligatorios');
        return;
      }
      
      // Crear usuario con solo los datos necesarios (como en web)
      const userData = {
        email: formData.email,
        companyName: formData.companyName,
        category: formData.category,
        folders: []
      };
      
      await authService.registerUser(userData);
      
      Alert.alert(
        'Éxito', 
        `Usuario creado correctamente con acceso automático a todas las carpetas de la categoría "${formData.category.replace('_', ' ')}". Se enviará un email con las credenciales temporales.`
      );
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Error creando usuario:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onCancel}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="person-add" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Crear Nuevo Usuario</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Información del Usuario */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Información del Usuario</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="ejemplo@email.com"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Empresa *</Text>
              <TextInput
                style={styles.input}
                value={formData.companyName}
                onChangeText={(text) => setFormData({...formData, companyName: text})}
                placeholder="Nombre de la empresa"
              />
            </View>
          </View>

          {/* Selección de Categoría */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Categoría del Usuario</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoría *</Text>
              <Text style={styles.categoryDescription}>
                Esta categoría determinará qué carpetas se asignarán automáticamente al usuario
              </Text>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryOption,
                    formData.category === category.value && styles.categorySelected
                  ]}
                  onPress={() => setFormData({...formData, category: category.value as 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros'})}
                >
                  <View style={styles.categoryContent}>
                    <Text style={[
                      styles.categoryText,
                      formData.category === category.value && styles.categoryTextSelected
                    ]}>
                      {category.label}
                    </Text>
                    <Text style={[
                      styles.categorySubtext,
                      formData.category === category.value && styles.categorySubtextSelected
                    ]}>
                      {category.description}
                    </Text>
                  </View>
                  {formData.category === category.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Información importante */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Información importante:</Text>
              <Text style={styles.infoText}>• El usuario recibirá un email con credenciales temporales</Text>
              <Text style={styles.infoText}>• Se le asignarán automáticamente todas las carpetas de la categoría seleccionada</Text>
              <Text style={styles.infoText}>• El usuario podrá ser asignado a un grupo para control de sesiones</Text>
              <Text style={styles.infoText}>• Podrá cambiar su contraseña después del primer login</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.submitButtonText}>Creando Usuario...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.submitButtonText}>Crear Usuario</Text>
              </>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
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
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#f8f9fa',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  categorySelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  categoryContent: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  categoryTextSelected: {
    color: '#007AFF',
  },
  categorySubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  categorySubtextSelected: {
    color: '#1976d2',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});