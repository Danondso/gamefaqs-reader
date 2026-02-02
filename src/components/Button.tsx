/**
 * Button - Classic GameFAQs-style button component
 *
 * Solid blue (#3366CC) button with white text.
 * Flat design (no shadows), minimal padding, simple press state.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.surface;
      case 'danger':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textSecondary;
    if (variant === 'secondary') return theme.colors.text;
    return '#FFFFFF';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md };
      case 'medium':
        return { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg };
      case 'large':
        return { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.xl };
      default:
        return { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.fontSize.xs;
      case 'medium':
        return theme.typography.fontSize.sm;
      case 'large':
        return theme.typography.fontSize.md;
      default:
        return theme.typography.fontSize.sm;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
          borderColor: variant === 'secondary' ? theme.colors.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
              fontWeight: theme.typography.fontWeight.bold,
            },
            textStyle,
          ]}
          allowFontScaling
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target
    borderRadius: 4, // Minimal rounding for slight modern touch
  },
  text: {
    textAlign: 'center',
  },
});
