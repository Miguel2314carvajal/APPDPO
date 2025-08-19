import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard Admin',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="usuarios" 
        options={{ 
          title: 'Gestión de Usuarios',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="carpetas" 
        options={{ 
          title: 'Gestión de Carpetas',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="subir-archivo" 
        options={{ 
          title: 'Subir Archivo',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="nuevo-usuario" 
        options={{ 
          title: 'Nuevo Usuario',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="editar-usuario" 
        options={{ 
          title: 'Editar Usuario',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
