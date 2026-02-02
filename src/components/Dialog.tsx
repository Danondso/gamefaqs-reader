/**
 * Dialog - Custom modal dialog component
 *
 * Classic GameFAQs-styled modal with simple white background,
 * 1px border, and classic blue buttons. Replaces Alert.alert().
 */

import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { Divider } from './Divider';

export interface DialogProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  actions?: Array<{
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  dismissable?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  onDismiss,
  title,
  message,
  children,
  actions = [],
  dismissable = true,
}) => {
  const { theme } = useTheme();

  const handleBackdropPress = () => {
    if (dismissable) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dialog,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
              {/* Title */}
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
                accessibilityRole="header"
              >
                {title}
              </Text>

              <Divider marginVertical={theme.spacing.md} />

              {/* Content */}
              <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {message && (
                  <Text
                    style={[
                      styles.message,
                      {
                        color: theme.colors.text,
                        fontSize: theme.typography.fontSize.sm,
                        lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
                      },
                    ]}
                  >
                    {message}
                  </Text>
                )}
                {children}
              </ScrollView>

              {/* Actions */}
              {actions.length > 0 && (
                <>
                  <Divider marginVertical={theme.spacing.md} />
                  <View style={styles.actions}>
                    {actions.map((action, index) => (
                      <View
                        key={index}
                        style={[
                          styles.actionButton,
                          { marginRight: index < actions.length - 1 ? theme.spacing.sm : 0 },
                        ]}
                      >
                        <Button
                          title={action.label}
                          onPress={action.onPress}
                          variant={action.variant || 'primary'}
                          size="medium"
                        />
                      </View>
                    ))}
                  </View>
                </>
              )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 4,
    padding: 20,
  },
  title: {
    textAlign: 'center',
  },
  content: {
    maxHeight: 300,
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 100,
  },
});
