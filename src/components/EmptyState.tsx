/**
 * EmptyState - Simple centered text for empty lists/screens
 *
 * Classic web-style empty state with optional action link.
 * No fancy icons - just clear text.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LinkButton } from './LinkButton';

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionTitle,
  onAction,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
          },
        ]}
        allowFontScaling
      >
        {title}
      </Text>
      {message && (
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
              marginTop: theme.spacing.sm,
            },
          ]}
          allowFontScaling
        >
          {message}
        </Text>
      )}
      {actionTitle && onAction && (
        <View style={{ marginTop: theme.spacing.lg }}>
          <LinkButton
            title={actionTitle}
            onPress={onAction}
            underline
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
