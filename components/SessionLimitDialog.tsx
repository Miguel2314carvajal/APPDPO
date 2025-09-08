import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface SessionLimitDialogProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  error: {
    message: string;
    maxSessions: number;
    activeSessions: number;
  };
}

export const SessionLimitDialog: React.FC<SessionLimitDialogProps> = ({
  visible,
  onClose,
  onRetry,
  error
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const { closeOtherSessions } = useAuth();

  const handleCloseOtherSessions = async () => {
    try {
      setIsClosing(true);
      await closeOtherSessions();
      Alert.alert(
        'Sesiones cerradas',
        'Se han cerrado las otras sesiones activas. Ahora puedes iniciar sesión.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              onClose();
              onRetry();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error cerrando sesiones:', error);
      Alert.alert(
        'Error',
        'No se pudieron cerrar las otras sesiones. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Ionicons name="warning" size={32} color="#FF6B6B" />
            <Text style={styles.title}>Límite de Sesiones Alcanzado</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              {error.message}
            </Text>

            <View style={styles.sessionInfo}>
              <Text style={styles.sessionText}>
                Sesiones activas: {error.activeSessions} / {error.maxSessions}
              </Text>
            </View>

            <Text style={styles.description}>
              Puedes cerrar las otras sesiones activas para continuar con el inicio de sesión.
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.closeSessionsButton]}
              onPress={handleCloseOtherSessions}
              disabled={isClosing}
            >
              {isClosing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.closeSessionsButtonText}>
                    Cerrar Otras Sesiones
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 12,
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  sessionInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sessionText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#E9ECEF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  cancelButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '500',
  },
  closeSessionsButton: {
    backgroundColor: '#DC3545',
  },
  closeSessionsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
