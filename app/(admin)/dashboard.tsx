import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { folderService } from '../../services/folderService';
import { fileService } from '../../services/fileService';
import { Ionicons } from '@expo/vector-icons';

interface DashboardStats {
  totalUsers: number;
  totalFolders: number;
  totalFiles: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ 
    totalUsers: 0, 
    totalFolders: 0, 
    totalFiles: 0, 
    adminUsers: 0,
    regularUsers: 0,
    recentUsers: [] 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  // Cargar datos cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  // Manejar el botón atrás del dispositivo (solo cuando la pantalla está enfocada)
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        Alert.alert(
          'Cerrar Sesión',
          '¿Estás seguro que deseas salir de tu sesión?',
          [
            {
              text: 'Cancelar',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Cerrar Sesión',
              onPress: async () => {
                await logout();
                // Navegar al login después de cerrar sesión
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              },
              style: 'destructive',
            },
          ]
        );
        return true; // Evita que se ejecute la acción por defecto
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }, [logout])
  );

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Cargando datos del dashboard...');
      setIsLoading(true);
      
      const [users, folders] = await Promise.all([
        authService.listUsers(),
        folderService.listFolders()
      ]);
      
      console.log('📊 Usuarios encontrados:', users.length);
      console.log('📁 Carpetas encontradas:', folders.length);
      
      // Calcular estadísticas más precisas
      const totalFiles = folders.reduce((acc, folder) => acc + (folder.files?.length || 0), 0);
      const adminUsers = users.filter(user => user.rol === 'admin').length;
      const regularUsers = users.filter(user => user.rol === 'usuario').length;
      
      const newStats = {
        totalUsers: users.length,
        totalFolders: folders.length,
        totalFiles,
        adminUsers,
        regularUsers,
        recentUsers: users.slice(0, 5)
      };
      
      console.log('📈 Estadísticas calculadas:', newStats);
      setStats(newStats);
      
    } catch (error: any) {
      console.error('❌ Error cargando dashboard:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
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
              // Navegar al login después de cerrar sesión
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error en logout:', error);
            }
          }
        }
      ]
    );
  };

  const navigateTo = (screen: string) => {
    (navigation as any).navigate(screen);
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshDashboard} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>¡Bienvenido, Administrador!</Text>
          <Text style={styles.userInfo}>
            {user?.companyName}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="white" />
          <Text style={styles.logoutText}>Cerrar</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Estadísticas del Sistema</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="folder" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{stats.totalFolders}</Text>
            <Text style={styles.statLabel}>Carpetas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="document" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{stats.totalFiles}</Text>
            <Text style={styles.statLabel}>Archivos</Text>
          </View>
        </View>
      </View>

      {/* Acciones Rápidas */}
      <View style={styles.quickActionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
        </View>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, styles.blueBorder]}
            onPress={() => navigation.navigate('NuevoUsuario' as never)}
          >
            <Ionicons name="person-add" size={32} color="#007AFF" />
            <Text style={styles.actionButtonText}>Nuevo Usuario</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.greenBorder]}
            onPress={() => navigation.navigate('Carpetas' as never)}
          >
            <Ionicons name="folder-open" size={32} color="#34C759" />
            <Text style={styles.actionButtonText}>Gestionar Carpetas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.redBorder]}
            onPress={() => navigation.navigate('SubirArchivo' as never)}
          >
            <Ionicons name="cloud-upload" size={32} color="#FF3B30" />
            <Text style={styles.actionButtonText}>Subir Archivo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Solo el botón de Gestión de Usuarios */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateTo('Usuarios')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="people" size={24} color="#007AFF" />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Gestión de Usuarios</Text>
            <Text style={styles.navDescription}>
              Crear, editar y eliminar usuarios del sistema
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
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
    paddingTop: 40,
    paddingBottom: 25,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 15,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 7,
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    fontWeight: '600',
  },
  quickActionsSection: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  blueBorder: {
    borderTopWidth: 3,
    borderTopColor: '#007AFF',
  },
  greenBorder: {
    borderTopWidth: 3,
    borderTopColor: '#34C759',
  },
  redBorder: {
    borderTopWidth: 3,
    borderTopColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 12,
    textAlign: 'center',
  },
  navigationContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  navIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  navDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});
