const fs = require('fs');
const path = require('path');

// Este script te ayudará a generar los iconos necesarios
// Necesitas tener tu logo en diferentes tamaños

console.log('📱 GENERADOR DE ICONOS PARA APP-PDP');
console.log('=====================================');
console.log('');
console.log('Para cambiar el logo de tu app, necesitas crear estos archivos:');
console.log('');
console.log('📁 assets/');
console.log('├── icon.png (1024x1024) - Icono principal');
console.log('├── adaptive-icon.png (1024x1024) - Icono adaptativo Android');
console.log('├── splash-icon.png (1284x2778) - Pantalla de carga');
console.log('└── favicon.png (48x48) - Favicon web');
console.log('');
console.log('📋 INSTRUCCIONES:');
console.log('1. Toma tu logo de SKILLMAN PDP');
console.log('2. Redimensiona a 1024x1024 píxeles');
console.log('3. Guárdalo como icon.png en la carpeta assets/');
console.log('4. Copia el mismo archivo como adaptive-icon.png');
console.log('5. Para splash-icon.png, crea una imagen 1284x2778 con el logo centrado');
console.log('6. Para favicon.png, redimensiona a 48x48 píxeles');
console.log('');
console.log('🎨 RECOMENDACIONES DE DISEÑO:');
console.log('- Usa fondo transparente o blanco');
console.log('- El logo debe ser visible en tamaños pequeños');
console.log('- Mantén el diseño simple y claro');
console.log('- Usa colores que contrasten bien');
console.log('');
console.log('✅ DESPUÉS DE CREAR LOS ARCHIVOS:');
console.log('1. Ejecuta: npx expo prebuild --clean');
console.log('2. Ejecuta: npx eas build --platform android --profile preview');
console.log('');
