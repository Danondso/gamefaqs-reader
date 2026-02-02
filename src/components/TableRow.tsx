/**
 * TableRow - Table-like row component for lists
 *
 * Mimics HTML table rows with optional borders.
 * Used for guide lists, settings rows, etc.
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface TableRowProps {
  children: ReactNode;
  onPress?: () => void;
  showBorder?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'none';
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  onPress,
  showBorder = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  const { theme } = useTheme();

  const rowStyle: ViewStyle = {
    borderBottomWidth: showBorder ? 1 : 0,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[styles.row, rowStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.row, rowStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 44, // Minimum touch target when pressable
  },
});
