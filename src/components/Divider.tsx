/**
 * Divider - Simple horizontal line
 *
 * Classic 1px solid line for separating content.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface DividerProps {
  style?: ViewStyle;
  marginVertical?: number;
}

export const Divider: React.FC<DividerProps> = ({ style, marginVertical }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: theme.colors.border,
          marginVertical: marginVertical !== undefined ? marginVertical : theme.spacing.sm,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
  },
});
