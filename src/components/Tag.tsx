/**
 * Tag - Simple inline tag/badge component
 *
 * Like HTML <span> with background color.
 * Used for platform tags, guide type tags, etc.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface TagProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  variant = 'default',
  size = 'small',
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.surface;
    }
  };

  const getTextColor = () => {
    if (variant === 'default') {
      return theme.colors.text;
    }
    return '#FFFFFF';
  };

  const getPadding = () => {
    if (size === 'small') {
      return { paddingVertical: 2, paddingHorizontal: theme.spacing.xs };
    }
    return { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm };
  };

  const getFontSize = () => {
    return size === 'small' ? theme.typography.fontSize.xs : theme.typography.fontSize.sm;
  };

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
          },
          textStyle,
        ]}
        allowFontScaling
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '400',
  },
});
