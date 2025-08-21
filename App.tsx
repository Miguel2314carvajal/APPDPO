import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';

// Importar pantallas
import LoginScreen from './app/(auth)/login';
import RegisterScreen from './app/(auth)/register';
import AdminDashboard from './app/(admin)/dashboard';
import UsuariosScreen from './app/(admin)/usuarios';
import NuevoUsuarioScreen from './app/(admin)/nuevo-usuario';
import EditarUsuarioScreen from './app/(admin)/editar-usuario';
import CarpetasScreen from './app/(admin)/carpetas';
import SubirArchivoScreen from './app/(admin)/subir-archivo';
import UserDashboard from './app/(user)/dashboard';

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
          <Stack.Screen name="NuevoUsuario" component={NuevoUsuarioScreen} />
          <Stack.Screen name="EditarUsuario" component={EditarUsuarioScreen} />
          <Stack.Screen name="Usuarios" component={UsuariosScreen} />
          <Stack.Screen name="Carpetas" component={CarpetasScreen} />
          <Stack.Screen name="SubirArchivo" component={SubirArchivoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
