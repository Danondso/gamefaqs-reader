/**
 * FontControls - Font size adjustment and bookmark navigation
 *
 * Classic GameFAQs-style controls with font +/- and bookmark up/down buttons.
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export interface FontControlsProps {
  fontSize: number;
  onIncrease: () => void;
  onDecrease: () => void;
  minSize?: number;
  maxSize?: number;
  // Bookmark navigation
  onPreviousBookmark?: () => void;
  onNextBookmark?: () => void;
  hasPreviousBookmark?: boolean;
  hasNextBookmark?: boolean;
}

export const FontControls: React.FC<FontControlsProps> = ({
  fontSize,
  onIncrease,
  onDecrease,
  minSize = 6,
  maxSize = 24,
  onPreviousBookmark,
  onNextBookmark,
  hasPreviousBookmark = false,
  hasNextBookmark = false,
}) => {
  const { theme } = useTheme();

  const canDecrease = fontSize > minSize;
  const canIncrease = fontSize < maxSize;

  return (
    <View style={styles.container}>
      {/* Font size controls */}
      <TouchableOpacity
        onPress={onDecrease}
        disabled={!canDecrease}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: canDecrease ? 1 : 0.5,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Decrease font size"
        accessibilityState={{ disabled: !canDecrease }}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
            },
          ]}
        >
          A−
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.sizeText,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            marginHorizontal: theme.spacing.sm,
          },
        ]}
      >
        {fontSize}px
      </Text>

      <TouchableOpacity
        onPress={onIncrease}
        disabled={!canIncrease}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: canIncrease ? 1 : 0.5,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Increase font size"
        accessibilityState={{ disabled: !canIncrease }}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
            },
          ]}
        >
          A+
        </Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      {/* Bookmark navigation - Previous */}
      <TouchableOpacity
        onPress={onPreviousBookmark}
        disabled={!hasPreviousBookmark}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: hasPreviousBookmark ? 1 : 0.3,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go to previous bookmark"
        accessibilityState={{ disabled: !hasPreviousBookmark }}
      >
        <Ionicons
          name="chevron-up"
          size={20}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {/* Bookmark navigation - Next */}
      <TouchableOpacity
        onPress={onNextBookmark}
        disabled={!hasNextBookmark}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: hasNextBookmark ? 1 : 0.3,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go to next bookmark"
        accessibilityState={{ disabled: !hasNextBookmark }}
      >
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  buttonText: {
    fontWeight: '600',
  },
  sizeText: {
    fontWeight: '400',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#ccc',
    marginHorizontal: 8,
  },
});
