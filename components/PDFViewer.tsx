import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  fileId?: string; // ID de MongoDB del archivo
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function PDFViewer({ fileUrl, fileName, fileId, onClose }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const navigation = useNavigation();

  // Obtener URL del PDF
  useEffect(() => {
    getPdfUrl();
  }, []);

  const getPdfUrl = async () => {
    try {
      console.log('📥 Obteniendo URL del PDF...');
      setIsLoading(true);
      
      // SOLUCIÓN DEFINITIVA: Usar SOLAMENTE el endpoint del backend
      if (fileId) {
        console.log('🔄 Obteniendo URL segura del backend para ID:', fileId);
        
        const backendUrl = 'http://192.168.100.155:3000';
        const token = await AsyncStorage.getItem('token');
        
        try {
          // Obtener URL segura del backend
          const response = await fetch(`${backendUrl}/api/files/servir/${fileId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.url) {
              console.log('✅ URL segura obtenida del backend:', data.url);
              setPdfUrl(data.url);
              setIsLoading(false);
              return;
            } else {
              throw new Error('No se pudo obtener URL segura del backend');
            }
          } else {
            throw new Error(`Error del backend: ${response.status}`);
          }
        } catch (backendError: unknown) {
          console.error('❌ Error con backend:', backendError);
          const errorMessage = backendError instanceof Error ? backendError.message : 'Error desconocido';
          setError(`Error obteniendo archivo: ${errorMessage}`);
          setIsLoading(false);
        }
      } else {
        throw new Error('No se proporcionó ID del archivo');
      }
      
    } catch (error: unknown) {
      console.error('❌ Error obteniendo URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error obteniendo URL: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error('❌ Error cargando PDF:', error);
    setError('No se pudo cargar el PDF');
    setIsLoading(false);
  };

  const handleLoadComplete = () => {
    console.log('✅ PDF cargado completamente');
    setIsLoading(false);
  };

  const handleDownload = () => {
    Alert.alert(
      'Descargar PDF',
      `¿Deseas descargar "${fileName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descargar', onPress: () => {
          getPdfUrl();
        }}
      ]
    );
  };

  // Cerrar el visor
  const handleClose = () => {
    onClose();
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#e74c3c" />
          <Text style={styles.errorTitle}>Error al cargar el PDF</Text>
          <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={() => {
              setError(null);
              getPdfUrl();
            }}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {fileName}
        </Text>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Ionicons name="download" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando PDF...</Text>
          </View>
        )}
        
                          {pdfUrl ? (
           <View style={styles.pdfContent}>
             <View style={styles.pdfInfo}>
               <Ionicons name="document" size={64} color="#3498db" />
               <Text style={styles.pdfTitle}>{fileName}</Text>
               <Text style={styles.pdfUrl}>{pdfUrl}</Text>
               <TouchableOpacity 
                 style={styles.openButton}
                 onPress={() => Linking.openURL(pdfUrl)}
               >
                 <Text style={styles.openButtonText}>Abrir PDF</Text>
               </TouchableOpacity>
             </View>
           </View>
         ) : (
           <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color="#3498db" />
             <Text style={styles.loadingText}>Obteniendo URL del archivo...</Text>
           </View>
         )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2c3e50',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  pdfInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  pdfUrl: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  openButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
