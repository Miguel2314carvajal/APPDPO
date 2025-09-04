import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { folderService } from '../../services/folderService';
import { authService } from '../../services/authService';

interface Folder {
  _id: string;
  name: string;
  files: any[];
  usuarios: string[];
  createdAt: string;
  updatedAt: string;
}

export default function UserDashboard() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user, logout } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadUserFolders();
  }, []);

  // Debug: Log user data
  useEffect(() => {
    if (user) {
      console.log('👤 Usuario en dashboard:', user);
    }
  }, [user]);

  const loadUserFolders = async () => {
    try {
      console.log('🔄 Cargando carpetas del usuario:', user?.email);
      console.log('📁 Carpetas asignadas al usuario:', user?.folders);
      
      setIsLoading(true);
      
      // Obtener las carpetas asignadas al usuario
      if (user?.folders && user.folders.length > 0) {
        console.log('🔍 Buscando', user.folders.length, 'carpetas...');
        
        const userFolders = await Promise.all(
          user.folders.map(async (folderId: string) => {
            try {
              console.log('📂 Cargando carpeta:', folderId);
              const folder = await folderService.getFolder(folderId);
              console.log('✅ Carpeta cargada:', folder.name);
              return folder;
            } catch (error) {
              console.error(`❌ Error cargando carpeta ${folderId}:`, error);
              return null;
            }
          })
        );
        
        // Filtrar carpetas válidas
        const validFolders = userFolders.filter(folder => folder !== null);
        console.log('📊 Carpetas válidas encontradas:', validFolders.length);
        setFolders(validFolders);
      } else {
        console.log('⚠️ Usuario no tiene carpetas asignadas, intentando sincronizar...');
        
        // Intentar sincronizar carpetas del usuario
        try {
          if (!user?._id) {
            console.log('⚠️ No se puede sincronizar: usuario sin ID');
            setFolders([]);
            return;
          }
          
          const syncResult = await authService.syncUserFolders(user._id);
          console.log('🔄 Resultado de sincronización:', syncResult);
          
          if (syncResult.folders && syncResult.folders.length > 0) {
            console.log('✅ Carpetas sincronizadas, cargando...');
            
            const userFolders = await Promise.all(
              syncResult.folders.map(async (folderId: string) => {
                try {
                  const folder = await folderService.getFolder(folderId);
                  return folder;
                } catch (error) {
                  console.error(`❌ Error cargando carpeta ${folderId}:`, error);
                  return null;
                }
              })
            );
            
            const validFolders = userFolders.filter(folder => folder !== null);
            console.log('📊 Carpetas válidas después de sincronización:', validFolders.length);
            setFolders(validFolders);
          } else {
            console.log('⚠️ No se encontraron carpetas después de sincronizar');
            setFolders([]);
          }
        } catch (syncError) {
          console.error('❌ Error sincronizando carpetas:', syncError);
          setFolders([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error cargando carpetas del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFolders = async () => {
    setIsRefreshing(true);
    await loadUserFolders();
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
              (navigation as any).navigate('Login');
            } catch (error) {
              console.error('Error en logout:', error);
            }
          }
        }
      ]
    );
  };

  const openFolder = (folder: Folder) => {
    // Navegar a la pantalla de detalle de carpeta
    (navigation as any).navigate('CarpetaDetalle', { folderId: folder._id });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando tus carpetas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshFolders} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.userInfo}>
              {user?.companyName}
            </Text>
            <Text style={styles.userRole}>
              <Ionicons name="person" size={14} color="#95a5a6" /> Usuario Regular
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Información del usuario */}
        <View style={styles.userInfoContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="clipboard" size={20} color="#2c3e50" />
            <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
            
            {/* Botón para cambiar contraseña */}
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => (navigation as any).navigate('CambiarContrasena')}
            >
              <Ionicons name="key" size={16} color="#3498db" />
              <Text style={styles.changePasswordText}>Cambiar Contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carpetas asignadas */}
        <View style={styles.foldersContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder" size={20} color="#2c3e50" />
            <Text style={styles.sectionTitle}>Tus Carpetas Asignadas</Text>
          </View>
          {/* Buscador */}
          <View style={{ marginBottom: 12 }}>
            <TextInput
              placeholder="Buscar carpeta..."
              value={search}
              onChangeText={setSearch}
              style={{ backgroundColor: 'white', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e1e5ea' }}
            />
          </View>
          
          {folders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={64} color="#bdc3c7" />
              <Text style={styles.emptyStateTitle}>No tienes carpetas asignadas</Text>
              <Text style={styles.emptyStateText}>
                El administrador aún no te ha asignado carpetas. Contacta al administrador del sistema.
              </Text>
            </View>
          ) : (
            <View style={styles.foldersGrid}>
              {folders
                .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
                .map((folder) => (
                <TouchableOpacity
                  key={folder._id}
                  style={styles.folderCard}
                  onPress={() => openFolder(folder)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="folder" size={32} color="#f39c12" style={styles.folderIcon} />
                  <Text style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.folderFiles}>
                    {folder.files?.length || 0} archivos
                  </Text>
                  <Text style={styles.folderDate}>
                    {new Date(folder.createdAt).toLocaleDateString('es-ES')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#95a5a6',
    fontWeight: '600',
  },
  logoutButton: {
    width: 44,
    height: 44,
    backgroundColor: '#e74c3c',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  userInfoContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  foldersContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  folderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  folderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  folderFiles: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  folderDate: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  statsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e0f2f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  changePasswordText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
});
