/**
 * Typography System - Classic Web Style
 *
 * Uses system fonts only (no custom font loading).
 * Simple scale with straightforward sizes.
 */

import { Platform } from 'react-native';

export const typography = {
  // Font families
  fontFamily: {
    system: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    monospace: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'Courier',
    }),
  },

  // Font sizes (simple scale)
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
} as const;

export type Typography = typeof typography;
