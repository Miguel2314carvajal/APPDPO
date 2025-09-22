import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';

// Importar pantallas
import LoginScreen from './app/(auth)/login';
import RegisterScreen from './app/(auth)/register';
import AdminDashboard from './app/(admin)/dashboard';
import GestionUsuariosScreen from './app/(admin)/gestion-usuarios';
import NuevoUsuarioScreen from './app/(admin)/nuevo-usuario';
import EditarUsuarioScreen from './app/(admin)/editar-usuario';
import CarpetasNuevasScreen from './app/(admin)/carpetas-nuevas';
import SubirArchivoScreen from './app/(admin)/subir-archivo';
import GestionarArchivosScreen from './app/(admin)/gestionar-archivos';
import CarpetaDetalleAdminScreen from './app/(admin)/carpeta-detalle';
import GestionGruposScreen from './app/(admin)/gestion-grupos';
import NuevoGrupoScreen from './app/(admin)/nuevo-grupo';
import DetalleGrupoScreen from './app/(admin)/detalle-grupo';
import EditarGrupoScreen from './app/(admin)/editar-grupo';
import UserDashboard from './app/(user)/dashboard';
import CarpetaDetalleScreen from './app/(user)/carpeta-detalle';
import CambiarContrasenaScreen from './app/(user)/cambiar-contrasena';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            cardStyle: { backgroundColor: '#f5f5f5' }
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="UserDashboard" component={UserDashboard} />
          <Stack.Screen name="CarpetaDetalle" component={CarpetaDetalleScreen} />
          <Stack.Screen name="CambiarContrasena" component={CambiarContrasenaScreen} />
          <Stack.Screen name="NuevoUsuario" component={NuevoUsuarioScreen} />
          <Stack.Screen name="EditarUsuario" component={EditarUsuarioScreen} />
          <Stack.Screen name="GestionUsuarios" component={GestionUsuariosScreen} />
          <Stack.Screen name="CarpetasNuevas" component={CarpetasNuevasScreen} />
          <Stack.Screen name="SubirArchivo" component={SubirArchivoScreen} />
          <Stack.Screen name="CarpetaDetalleAdmin" component={CarpetaDetalleAdminScreen} />
          <Stack.Screen name="GestionarArchivos" component={GestionarArchivosScreen} />
          <Stack.Screen name="GestionGrupos" component={GestionGruposScreen} />
          <Stack.Screen name="NuevoGrupo" component={NuevoGrupoScreen} />
          <Stack.Screen name="DetalleGrupo" component={DetalleGrupoScreen} />
          <Stack.Screen name="EditarGrupo" component={EditarGrupoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
