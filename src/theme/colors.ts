/**
 * Classic GameFAQs Color Palette (1999-2004 Era)
 *
 * Inspired by the iconic blue (#3366CC) and white design
 * from GameFAQs' golden era. High contrast, functional,
 * and nostalgic.
 */

export const lightColors = {
  // Primary - The iconic GameFAQs blue
  primary: '#3366CC',
  primaryDark: '#003399',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',

  // Borders
  border: '#CCCCCC',

  // Text
  text: '#000000',
  textSecondary: '#666666',

  // Links (classic web style)
  link: '#3366CC',
  linkVisited: '#663399',

  // Status colors
  error: '#CC0000',
  success: '#009900',
  warning: '#FF9900',

  // Highlight (search results, selections)
  highlight: '#FFFF99',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkColors = {
  // Primary - Lighter for visibility on dark
  primary: '#6699FF',
  primaryDark: '#3366CC',

  // Backgrounds
  background: '#000000',
  surface: '#1A1A1A',

  // Borders
  border: '#333333',

  // Text
  text: '#FFFFFF',
  textSecondary: '#999999',

  // Links
  link: '#6699FF',
  linkVisited: '#9966FF',

  // Status colors
  error: '#FF6666',
  success: '#66CC66',
  warning: '#FFCC66',

  // Highlight
  highlight: '#FFFF66',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export type Colors = typeof lightColors;
