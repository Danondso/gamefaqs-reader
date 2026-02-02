/**
 * Classic GameFAQs Theme Configuration
 *
 * Centralized theme system that combines colors, spacing,
 * and typography. Supports light and dark modes.
 */

import { lightColors, darkColors, type Colors } from './colors';
import { spacing, type Spacing } from './spacing';
import { typography, type Typography } from './typography';

export interface Theme {
  colors: Colors;
  spacing: Spacing;
  typography: Typography;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  typography,
  isDark: true,
};

/**
 * Get theme based on color scheme preference
 */
export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};

export type { Colors, Spacing, Typography };
