/**
 * Toast - Simple bottom notification component
 *
 * Classic GameFAQs-styled toast notification that slides up from bottom.
 * Auto-dismisses after a duration. Replaces non-critical Alert.alert() calls.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onDismiss: () => void;
  variant?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 3000,
  onDismiss,
  variant = 'info',
  action,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      const timer = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      dismissToast();
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: getBackgroundColor(),
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <Text
          style={[
            styles.message,
            {
              fontSize: theme.typography.fontSize.sm,
              color: '#FFFFFF',
              flex: 1,
            },
          ]}
        >
          {message}
        </Text>
        {action && (
          <TouchableOpacity
            onPress={() => {
              action.onPress();
              dismissToast();
            }}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text
              style={[
                styles.actionText,
                {
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: '#FFFFFF',
                },
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    width: '100%',
  },
  message: {
    lineHeight: 20,
  },
  action: {
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionText: {
    // Style defined inline
  },
});
