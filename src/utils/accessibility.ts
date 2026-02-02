/**
 * Accessibility Utilities
 *
 * Helper functions for generating consistent accessibility props
 * and validating accessibility requirements.
 */

import type { AccessibilityProps } from 'react-native';

/**
 * Minimum touch target size (iOS HIG and Material Design guidelines)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Generate accessibility props for a button
 */
export function getButtonA11yProps(
  label: string,
  hint?: string
): Pick<AccessibilityProps, 'accessibilityRole' | 'accessibilityLabel' | 'accessibilityHint'> {
  return {
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Generate accessibility props for a link
 */
export function getLinkA11yProps(
  label: string,
  hint?: string
): Pick<AccessibilityProps, 'accessibilityRole' | 'accessibilityLabel' | 'accessibilityHint'> {
  return {
    accessibilityRole: 'link',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Generate accessibility props for a header
 */
export function getHeaderA11yProps(
  label: string,
  level?: 1 | 2 | 3 | 4 | 5 | 6
): Pick<AccessibilityProps, 'accessibilityRole' | 'accessibilityLabel'> {
  return {
    accessibilityRole: 'header',
    accessibilityLabel: label,
  };
}

/**
 * Generate accessibility props for an image
 */
export function getImageA11yProps(
  label: string
): Pick<AccessibilityProps, 'accessibilityRole' | 'accessibilityLabel'> {
  return {
    accessibilityRole: 'image',
    accessibilityLabel: label,
  };
}

/**
 * Generate accessibility label for a guide item
 */
export function getGuideItemLabel(
  title: string,
  platform?: string,
  format?: string
): string {
  let label = `${title} guide`;
  if (platform) {
    label += ` for ${platform}`;
  }
  if (format) {
    label += `, ${format} format`;
  }
  return label;
}

/**
 * Generate accessibility label for a bookmark
 */
export function getBookmarkLabel(
  title: string,
  position?: number
): string {
  if (title && position !== undefined) {
    return `Bookmark: ${title} at position ${position}`;
  }
  if (title) {
    return `Bookmark: ${title}`;
  }
  return 'Bookmark';
}

/**
 * Validate that a touch target meets minimum size requirements
 */
export function validateTouchTargetSize(
  width: number,
  height: number
): { valid: boolean; message?: string } {
  if (width < MIN_TOUCH_TARGET_SIZE || height < MIN_TOUCH_TARGET_SIZE) {
    return {
      valid: false,
      message: `Touch target size ${width}x${height} is below minimum ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}`,
    };
  }
  return { valid: true };
}

/**
 * Calculate color contrast ratio (WCAG 2.0)
 * Returns ratio between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standard
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = largeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Check if color contrast meets WCAG AAA standard
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = largeText ? 4.5 : 7;
  return ratio >= requiredRatio;
}

/**
 * Get relative luminance of a color (WCAG 2.0 formula)
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const channel = val / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

/**
 * Format file size for screen readers
 */
export function formatFileSizeA11y(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'kilobytes', 'megabytes', 'gigabytes'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${value} ${sizes[i]}`;
}

/**
 * Format count for screen readers (handles singular/plural)
 */
export function formatCountA11y(count: number, singular: string, plural?: string): string {
  const pluralForm = plural || `${singular}s`;
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
