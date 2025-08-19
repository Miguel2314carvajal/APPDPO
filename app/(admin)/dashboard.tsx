import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';

interface DashboardStats {
  totalUsers: number;
  totalFolders: number;
  totalFiles: number;
  recentUsers: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalFolders: 0, totalFiles: 0, recentUsers: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [users, folders] = await Promise.all([
        authService.listUsers(),
        folderService.listFolders()
      ]);
      const totalFiles = folders.reduce((acc, folder) => acc + folder.files.length, 0);
      setStats({ totalUsers: users.length, totalFolders: folders.length, totalFiles, recentUsers: users.slice(0, 5) });
    } catch (error: any) {
      console.error('Error cargando dashboard:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.navigate('Login');
            } catch (error) {
              console.error('Error en logout:', error);
            }
          }
        }
      ]
    );
  };

  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>¡Bienvenido, Administrador!</Text>
          <Text style={styles.userInfo}>
            {user?.nombres} {user?.apellidos}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 Estadísticas del Sistema</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalFolders}</Text>
            <Text style={styles.statLabel}>Carpetas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalFiles}</Text>
            <Text style={styles.statLabel}>Archivos</Text>
          </View>
        </View>
      </View>

      {/* Acciones Rápidas */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]} 
            onPress={() => navigateTo('NuevoUsuario')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Nuevo Usuario</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => navigateTo('Carpetas')}
          >
            <Text style={styles.actionIcon}>📁</Text>
            <Text style={styles.actionText}>Gestionar Carpetas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.tertiaryAction]}
            onPress={() => navigateTo('SubirArchivo')}
          >
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Subir Archivo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navegación Principal */}
      <View style={styles.navigationContainer}>
        <Text style={styles.sectionTitle}>🧭 Navegación Principal</Text>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateTo('Usuarios')}
        >
          <Text style={styles.navIcon}>👥</Text>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Gestión de Usuarios</Text>
            <Text style={styles.navDescription}>
              Crear, editar y eliminar usuarios del sistema
            </Text>
          </View>
          <Text style={styles.navArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  userInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    fontSize: 24,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryAction: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  secondaryAction: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  tertiaryAction: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  navigationContainer: {
    padding: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  navDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  navArrow: {
    fontSize: 18,
    color: '#bdc3c7',
  },
  recentUsersContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
});
