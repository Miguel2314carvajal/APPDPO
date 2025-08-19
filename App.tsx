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
            gestureEnabled: false
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserDashboard"
            component={UserDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Usuarios"
            component={UsuariosScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NuevoUsuario"
            component={NuevoUsuarioScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Carpetas"
            component={CarpetasScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SubirArchivo"
            component={SubirArchivoScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
