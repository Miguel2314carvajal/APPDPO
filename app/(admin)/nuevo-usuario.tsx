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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';

export default function NuevoUsuarioScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    category: 'profesional_independiente' as 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.email || !formData.companyName) {
      Alert.alert('Error', 'Email y Empresa son obligatorios');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos como en el web (solo email, empresa, categoría)
      const userData = {
        email: formData.email,
        companyName: formData.companyName,
        category: formData.category,
        folders: [] // Array vacío - las carpetas se asignan automáticamente por categoría
      };

      await authService.registerUser(userData);
      Alert.alert(
        'Éxito', 
        `Usuario creado correctamente con acceso automático a todas las carpetas de la categoría "${formData.category.replace('_', ' ')}". Se enviará un email con las credenciales temporales.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.mensaje || 'Error al crear el usuario';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoría del Usuario *</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {formData.category === 'profesional_independiente' ? 'Profesional Independiente' :
                   formData.category === 'transporte_escolar' ? 'Transporte Escolar' :
                   'Encargador de Seguros'}
                </Text>
                <Ionicons 
                  name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showCategoryDropdown && (
                <View style={styles.dropdownMenu}>
                  {[
                    { value: 'profesional_independiente', label: 'Profesional Independiente', icon: 'person' },
                    { value: 'transporte_escolar', label: 'Transporte Escolar', icon: 'bus' },
                    { value: 'encargador_seguros', label: 'Encargador de Seguros', icon: 'shield-checkmark' }
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.value}
                      style={[
                        styles.dropdownItem,
                        formData.category === category.value && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        handleInputChange('category', category.value);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Ionicons 
                        name={category.icon as any} 
                        size={20} 
                        color={formData.category === category.value ? '#007AFF' : '#666'} 
                      />
                      <Text style={[
                        styles.dropdownItemText,
                        formData.category === category.value && styles.dropdownItemTextSelected
                      ]}>
                        {category.label}
                      </Text>
                      {formData.category === category.value && (
                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.categoryHelp}>
              Selecciona la categoría que mejor describe el tipo de usuario
            </Text>
          </View>


          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Información importante:</Text>
              <Text style={styles.infoText}>
                • El usuario recibirá un email con credenciales temporales{'\n'}
                • Se le asignarán automáticamente todas las carpetas de la categoría seleccionada{'\n'}
                • El usuario podrá ser asignado a un grupo para control de sesiones{'\n'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
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
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
    paddingVertical: 8,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
    paddingBottom: 14,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    padding: 18,
    marginBottom: 28,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
  },
  infoContent: {
    marginLeft: 10,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1976D2',
  },
  infoText: {
    color: '#1976D2',
    lineHeight: 22,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    marginTop: 8,
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
  dropdownContainer: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  categoryHelp: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});
