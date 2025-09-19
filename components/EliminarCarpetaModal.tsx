import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { folderService } from '../services/folderService';

interface EliminarCarpetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: any;
  onEliminacionCompleta: () => void;
}

const EliminarCarpetaModal: React.FC<EliminarCarpetaModalProps> = ({ 
  isOpen, 
  onClose, 
  folder, 
  onEliminacionCompleta 
}) => {
  const [opcionEliminacion, setOpcionEliminacion] = useState<string | null>(null);
  const [subcarpetasSeleccionadas, setSubcarpetasSeleccionadas] = useState<string[]>([]);
  const [todasLasSubcarpetas, setTodasLasSubcarpetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && folder) {
      cargarTodasLasSubcarpetas();
    }
  }, [isOpen, folder]);

  const cargarTodasLasSubcarpetas = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando subcarpetas para:', folder.name);
      
      // Usar el endpoint directo para obtener subcarpetas
      const subfoldersResponse = await folderService.getSubfolders(folder._id);
      console.log('📁 Respuesta de subcarpetas:', subfoldersResponse);
      
      // El backend devuelve { subcarpetas: [...] }, extraer el array
      const subcarpetas = (subfoldersResponse as any).subcarpetas || subfoldersResponse || [];
      console.log('📂 Subcarpetas encontradas:', subcarpetas.length);
      
      // Aplanar todas las subcarpetas recursivamente
      const subcarpetasAplanadas = aplanarSubcarpetas(subcarpetas);
      console.log('📁 Total de subcarpetas aplanadas:', subcarpetasAplanadas.length);
      setTodasLasSubcarpetas(subcarpetasAplanadas);
      
    } catch (error) {
      console.error('❌ Error cargando subcarpetas:', error);
      setTodasLasSubcarpetas([]);
    } finally {
      setLoading(false);
    }
  };

  // Función recursiva para aplanar todas las subcarpetas
  const aplanarSubcarpetas = (subcarpetas: any[], nivel = 0, ruta: number[] = []): any[] => {
    let resultado: any[] = [];
    
    console.log('🔍 Aplanando subcarpetas en nivel', nivel, ':', subcarpetas.length, 'elementos');
    
    subcarpetas.forEach((subcarpeta, index) => {
      const nuevaRuta = [...ruta, index];
      const subcarpetaConRuta = {
        ...subcarpeta,
        nivel,
        ruta: nuevaRuta.join('-'),
        rutaCompleta: nuevaRuta
      };
      
      console.log('📁 Agregando subcarpeta:', subcarpeta.name, 'nivel:', nivel);
      resultado.push(subcarpetaConRuta);
      
      // Verificar si tiene subcarpetas anidadas
      if (subcarpeta.subfolders && subcarpeta.subfolders.length > 0) {
        console.log('🔍 Subcarpeta', subcarpeta.name, 'tiene', subcarpeta.subfolders.length, 'subcarpetas anidadas');
        const subcarpetasAnidadas = aplanarSubcarpetas(
          subcarpeta.subfolders, 
          nivel + 1, 
          nuevaRuta
        );
        console.log('📁 Subcarpetas anidadas encontradas:', subcarpetasAnidadas.length);
        resultado = resultado.concat(subcarpetasAnidadas);
      } else {
        console.log('📁 Subcarpeta', subcarpeta.name, 'no tiene subcarpetas anidadas');
      }
    });
    
    return resultado;
  };

  const toggleSubcarpeta = (subcarpetaId: string) => {
    setSubcarpetasSeleccionadas(prev => {
      if (prev.includes(subcarpetaId)) {
        return prev.filter(id => id !== subcarpetaId);
      } else {
        return [...prev, subcarpetaId];
      }
    });
  };

  const seleccionarTodas = () => {
    setSubcarpetasSeleccionadas(todasLasSubcarpetas.map(sub => sub._id));
  };

  const deseleccionarTodas = () => {
    setSubcarpetasSeleccionadas([]);
  };

  const handleEliminar = async () => {
    if (!opcionEliminacion) {
      Alert.alert('Error', 'Por favor selecciona una opción de eliminación');
      return;
    }

    if (opcionEliminacion === 'seleccionar') {
      if (todasLasSubcarpetas.length === 0) {
        Alert.alert('Error', 'Esta carpeta no tiene subcarpetas para seleccionar');
        return;
      }
      if (subcarpetasSeleccionadas.length === 0) {
        Alert.alert('Error', 'Por favor selecciona al menos una subcarpeta para eliminar');
        return;
      }
    }

    try {
      setLoading(true);
      console.log('🗑️ Eliminando carpeta:', folder.name);
      console.log('📋 Opción seleccionada:', opcionEliminacion);
      console.log('📋 Subcarpetas seleccionadas:', subcarpetasSeleccionadas);
      
      // Implementar eliminación real basada en la opción seleccionada
      if (opcionEliminacion === 'todas') {
        // Función recursiva para eliminar todas las subcarpetas
        const eliminarSubcarpetasRecursivamente = async (subcarpetas: any[]) => {
          for (const subcarpeta of subcarpetas) {
            try {
              console.log('🗑️ Eliminando subcarpeta:', subcarpeta.name, subcarpeta._id);
              
              // Obtener subcarpetas de esta subcarpeta
              const subfoldersResponse = await folderService.getSubfolders(subcarpeta._id);
              const subfolders = (subfoldersResponse as any).subcarpetas || subfoldersResponse || [];
              
              // Eliminar subcarpetas anidadas recursivamente
              if (subfolders.length > 0) {
                await eliminarSubcarpetasRecursivamente(subfolders);
              }
              
              // Eliminar la subcarpeta actual
              await folderService.deleteFolder(subcarpeta._id);
            } catch (error) {
              console.error('❌ Error eliminando subcarpeta', subcarpeta.name, ':', error);
            }
          }
        };
        
        // Eliminar todas las subcarpetas recursivamente
        console.log('🗑️ Eliminando todas las subcarpetas recursivamente...');
        await eliminarSubcarpetasRecursivamente(todasLasSubcarpetas);
        
        // Luego eliminar la carpeta principal
        console.log('🗑️ Eliminando carpeta principal...');
        await folderService.deleteFolder(folder._id);
        Alert.alert('Éxito', `Carpeta "${folder.name}" y todas sus subcarpetas han sido eliminadas`);
        
      } else if (opcionEliminacion === 'solo') {
        // Solo eliminar la carpeta principal, mantener subcarpetas
        console.log('🗑️ Eliminando solo la carpeta principal...');
        await folderService.deleteFolder(folder._id);
        Alert.alert('Éxito', `Carpeta "${folder.name}" ha sido eliminada. Las subcarpetas se mantienen.`);
        
      } else if (opcionEliminacion === 'seleccionar') {
        // Eliminar solo las subcarpetas seleccionadas
        console.log('🗑️ Eliminando subcarpetas seleccionadas...');
        for (const subcarpetaId of subcarpetasSeleccionadas) {
          try {
            const subcarpeta = todasLasSubcarpetas.find(s => s._id === subcarpetaId);
            console.log('🗑️ Eliminando subcarpeta:', subcarpeta?.name, subcarpetaId);
            await folderService.deleteFolder(subcarpetaId);
          } catch (error) {
            console.error('❌ Error eliminando subcarpeta', subcarpetaId, ':', error);
          }
        }
        Alert.alert('Éxito', `${subcarpetasSeleccionadas.length} subcarpetas han sido eliminadas`);
      }
      
      onEliminacionCompleta();
      onClose();
    } catch (error: any) {
      console.error('❌ Error eliminando carpeta:', error);
      Alert.alert('Error', 'No se pudo eliminar la carpeta: ' + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Eliminar Carpeta</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            <Text style={styles.warningText}>
              ¿Estás seguro de que quieres eliminar la carpeta "{folder?.name}"?
            </Text>

            <Text style={styles.descriptionText}>
              Esta acción no se puede deshacer. Elige qué hacer con las subcarpetas:
            </Text>

            {/* Opciones de eliminación */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  opcionEliminacion === 'todas' && styles.optionButtonSelected
                ]}
                onPress={() => setOpcionEliminacion('todas')}
              >
                <View style={styles.optionContent}>
                  <Ionicons 
                    name="trash" 
                    size={24} 
                    color={opcionEliminacion === 'todas' ? '#FF3B30' : '#8E8E93'} 
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={[
                      styles.optionTitle,
                      opcionEliminacion === 'todas' && styles.optionTitleSelected
                    ]}>
                      Eliminar todo
                    </Text>
                    <Text style={styles.optionDescription}>
                      Eliminar la carpeta y todas sus subcarpetas
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={opcionEliminacion === 'todas' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={opcionEliminacion === 'todas' ? '#FF3B30' : '#C7C7CC'} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  opcionEliminacion === 'solo' && styles.optionButtonSelected
                ]}
                onPress={() => setOpcionEliminacion('solo')}
              >
                <View style={styles.optionContent}>
                  <Ionicons 
                    name="folder" 
                    size={24} 
                    color={opcionEliminacion === 'solo' ? '#FF9500' : '#8E8E93'} 
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={[
                      styles.optionTitle,
                      opcionEliminacion === 'solo' && styles.optionTitleSelected
                    ]}>
                      Solo la carpeta
                    </Text>
                    <Text style={styles.optionDescription}>
                      Eliminar solo la carpeta, mantener subcarpetas
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={opcionEliminacion === 'solo' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={opcionEliminacion === 'solo' ? '#FF9500' : '#C7C7CC'} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  opcionEliminacion === 'seleccionar' && styles.optionButtonSelected,
                  todasLasSubcarpetas.length === 0 && styles.optionButtonDisabled
                ]}
                onPress={() => todasLasSubcarpetas.length > 0 && setOpcionEliminacion('seleccionar')}
                disabled={todasLasSubcarpetas.length === 0}
              >
                <View style={styles.optionContent}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={todasLasSubcarpetas.length === 0 ? '#C7C7CC' : (opcionEliminacion === 'seleccionar' ? '#34C759' : '#8E8E93')} 
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={[
                      styles.optionTitle,
                      opcionEliminacion === 'seleccionar' && styles.optionTitleSelected,
                      todasLasSubcarpetas.length === 0 && styles.optionTitleDisabled
                    ]}>
                      Seleccionar subcarpetas
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      todasLasSubcarpetas.length === 0 && styles.optionDescriptionDisabled
                    ]}>
                      {todasLasSubcarpetas.length === 0 ? 'No hay subcarpetas disponibles' : 'Elegir qué subcarpetas eliminar'}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={opcionEliminacion === 'seleccionar' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={todasLasSubcarpetas.length === 0 ? '#C7C7CC' : (opcionEliminacion === 'seleccionar' ? '#34C759' : '#C7C7CC')} 
                />
              </TouchableOpacity>
            </View>

            {/* Lista de subcarpetas para seleccionar */}
            {opcionEliminacion === 'seleccionar' && todasLasSubcarpetas.length > 0 && (
              <View style={styles.subcarpetasContainer}>
                <View style={styles.subcarpetasHeader}>
                  <Text style={styles.subcarpetasTitle}>
                    Subcarpetas ({todasLasSubcarpetas.length})
                  </Text>
                  <View style={styles.subcarpetasActions}>
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={seleccionarTodas}
                    >
                      <Text style={styles.selectAllText}>Todas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deselectAllButton}
                      onPress={deseleccionarTodas}
                    >
                      <Text style={styles.deselectAllText}>Ninguna</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView style={styles.subcarpetasList} nestedScrollEnabled>
                  {todasLasSubcarpetas.map((subcarpeta) => (
                    <TouchableOpacity
                      key={subcarpeta._id}
                      style={[
                        styles.subcarpetaItem,
                        subcarpetasSeleccionadas.includes(subcarpeta._id) && styles.subcarpetaItemSelected
                      ]}
                      onPress={() => toggleSubcarpeta(subcarpeta._id)}
                    >
                      <View style={styles.subcarpetaContent}>
                        <View style={[
                          styles.subcarpetaIndent,
                          { marginLeft: subcarpeta.nivel * 20 }
                        ]}>
                          <Ionicons 
                            name="folder" 
                            size={16} 
                            color={subcarpetasSeleccionadas.includes(subcarpeta._id) ? '#FF3B30' : '#FF9500'} 
                          />
                        </View>
                        <Text style={[
                          styles.subcarpetaName,
                          subcarpetasSeleccionadas.includes(subcarpeta._id) && styles.subcarpetaNameSelected
                        ]}>
                          {subcarpeta.name}
                        </Text>
                      </View>
                      <Ionicons 
                        name={subcarpetasSeleccionadas.includes(subcarpeta._id) ? 'checkmark-circle' : 'ellipse-outline'} 
                        size={20} 
                        color={subcarpetasSeleccionadas.includes(subcarpeta._id) ? '#FF3B30' : '#C7C7CC'} 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelActionButton} onPress={onClose}>
            <Text style={styles.cancelActionText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.deleteActionButton, loading && styles.deleteActionButtonDisabled]}
            onPress={handleEliminar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.deleteActionText}>Eliminar</Text>
                <Ionicons name="trash" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60, // Más espacio desde arriba
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  warningText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
    minHeight: 80,
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionButtonDisabled: {
    borderColor: '#E5E5EA',
    backgroundColor: '#F2F2F7',
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  optionTitleDisabled: {
    color: '#C7C7CC',
  },
  optionDescriptionDisabled: {
    color: '#C7C7CC',
  },
  subcarpetasContainer: {
    marginTop: 16,
  },
  subcarpetasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subcarpetasTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  subcarpetasActions: {
    flexDirection: 'row',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#34C759',
    borderRadius: 8,
    marginRight: 8,
  },
  selectAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deselectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8E8E93',
    borderRadius: 8,
  },
  deselectAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subcarpetasList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  subcarpetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  subcarpetaItemSelected: {
    backgroundColor: '#FFF0F0',
  },
  subcarpetaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcarpetaIndent: {
    marginRight: 8,
  },
  subcarpetaName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  subcarpetaNameSelected: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    backgroundColor: 'white',
    marginRight: 12,
    alignItems: 'center',
    minHeight: 56,
  },
  cancelActionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E8E93',
  },
  deleteActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    marginLeft: 12,
    minHeight: 56,
  },
  deleteActionButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  deleteActionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});

export default EliminarCarpetaModal;
