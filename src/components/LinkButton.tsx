/**
 * LinkButton - Classic blue underlined link component
 *
 * Mimics classic web hyperlinks with the iconic GameFAQs blue.
 * Optional underline, simple press state.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface LinkButtonProps {
  onPress: () => void;
  title: string;
  underline?: boolean;
  visited?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  onPress,
  title,
  underline = false,
  visited = false,
  size = 'medium',
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();

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

  const linkColor = visited ? theme.colors.linkVisited : theme.colors.link;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      style={styles.container}
    >
      <Text
        style={[
          styles.text,
          {
            color: linkColor,
            fontSize: getFontSize(),
            textDecorationLine: underline ? 'underline' : 'none',
          },
          style,
        ]}
        allowFontScaling
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 44, // Minimum touch target
    minWidth: 44,
    justifyContent: 'center',
  },
  text: {
    // Default style
  },
});
