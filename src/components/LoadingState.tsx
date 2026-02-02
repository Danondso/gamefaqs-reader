/**
 * LoadingState - Simple blue spinner with optional message
 *
 * Classic loading indicator in GameFAQs blue.
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.primary} size={size} />
      {message && (
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
              marginTop: theme.spacing.md,
            },
          ]}
          allowFontScaling
        >
          {message}
        </Text>
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
  message: {
    textAlign: 'center',
  },
});
