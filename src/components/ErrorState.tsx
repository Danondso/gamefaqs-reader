/**
 * ErrorState - Red error text with retry link
 *
 * Classic error display with action to retry.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LinkButton } from './LinkButton';

export interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryTitle?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryTitle = 'Try Again',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.error,
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
      {onRetry && (
        <View style={{ marginTop: theme.spacing.lg }}>
          <LinkButton
            title={retryTitle}
            onPress={onRetry}
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
