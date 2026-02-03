import {
  MIN_TOUCH_TARGET_SIZE,
  getButtonA11yProps,
  getLinkA11yProps,
  getHeaderA11yProps,
  getImageA11yProps,
  getGuideItemLabel,
  getBookmarkLabel,
  validateTouchTargetSize,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  formatFileSizeA11y,
  formatCountA11y,
} from '../utils/accessibility';

describe('accessibility utilities', () => {
  describe('MIN_TOUCH_TARGET_SIZE', () => {
    it('should be 44 pixels (iOS HIG and Material Design guideline)', () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    });
  });

  describe('getButtonA11yProps', () => {
    it('should return button role with label', () => {
      const props = getButtonA11yProps('Submit form');

      expect(props.accessibilityRole).toBe('button');
      expect(props.accessibilityLabel).toBe('Submit form');
    });

    it('should include hint when provided', () => {
      const props = getButtonA11yProps('Delete', 'Removes the selected item');

      expect(props.accessibilityHint).toBe('Removes the selected item');
    });

    it('should have undefined hint when not provided', () => {
      const props = getButtonA11yProps('Click me');

      expect(props.accessibilityHint).toBeUndefined();
    });
  });

  describe('getLinkA11yProps', () => {
    it('should return link role with label', () => {
      const props = getLinkA11yProps('Visit website');

      expect(props.accessibilityRole).toBe('link');
      expect(props.accessibilityLabel).toBe('Visit website');
    });

    it('should include hint when provided', () => {
      const props = getLinkA11yProps('GitHub', 'Opens in external browser');

      expect(props.accessibilityHint).toBe('Opens in external browser');
    });

    it('should have undefined hint when not provided', () => {
      const props = getLinkA11yProps('Documentation');

      expect(props.accessibilityHint).toBeUndefined();
    });
  });

  describe('getHeaderA11yProps', () => {
    it('should return header role with label', () => {
      const props = getHeaderA11yProps('Section Title');

      expect(props.accessibilityRole).toBe('header');
      expect(props.accessibilityLabel).toBe('Section Title');
    });

    it('should accept optional level parameter without affecting output', () => {
      // Level parameter is reserved for future use but doesn't affect current output
      const withLevel = getHeaderA11yProps('Heading', 2);
      const withoutLevel = getHeaderA11yProps('Heading');

      expect(withLevel.accessibilityRole).toBe('header');
      expect(withoutLevel.accessibilityRole).toBe('header');
    });
  });

  describe('getImageA11yProps', () => {
    it('should return image role with label', () => {
      const props = getImageA11yProps('Screenshot of game menu');

      expect(props.accessibilityRole).toBe('image');
      expect(props.accessibilityLabel).toBe('Screenshot of game menu');
    });

    it('should handle empty label', () => {
      const props = getImageA11yProps('');

      expect(props.accessibilityRole).toBe('image');
      expect(props.accessibilityLabel).toBe('');
    });
  });

  describe('getGuideItemLabel', () => {
    it('should return basic guide label', () => {
      const label = getGuideItemLabel('Super Mario Bros');

      expect(label).toBe('Super Mario Bros guide');
    });

    it('should include platform when provided', () => {
      const label = getGuideItemLabel('Super Mario Bros', 'NES');

      expect(label).toBe('Super Mario Bros guide for NES');
    });

    it('should include format when provided', () => {
      const label = getGuideItemLabel('Super Mario Bros', undefined, 'txt');

      expect(label).toBe('Super Mario Bros guide, txt format');
    });

    it('should include both platform and format', () => {
      const label = getGuideItemLabel('Super Mario Bros', 'NES', 'txt');

      expect(label).toBe('Super Mario Bros guide for NES, txt format');
    });

    it('should handle empty title', () => {
      const label = getGuideItemLabel('');

      expect(label).toBe(' guide');
    });
  });

  describe('getBookmarkLabel', () => {
    it('should return label with title and position', () => {
      const label = getBookmarkLabel('Chapter 5', 1500);

      expect(label).toBe('Bookmark: Chapter 5 at position 1500');
    });

    it('should return label with title only when no position', () => {
      const label = getBookmarkLabel('Important Section');

      expect(label).toBe('Bookmark: Important Section');
    });

    it('should return label with title when position is undefined', () => {
      const label = getBookmarkLabel('My Bookmark', undefined);

      expect(label).toBe('Bookmark: My Bookmark');
    });

    it('should handle position of 0', () => {
      const label = getBookmarkLabel('Start', 0);

      expect(label).toBe('Bookmark: Start at position 0');
    });

    it('should return generic label when title is empty', () => {
      const label = getBookmarkLabel('');

      expect(label).toBe('Bookmark');
    });
  });

  describe('validateTouchTargetSize', () => {
    it('should return valid for minimum size (44x44)', () => {
      const result = validateTouchTargetSize(44, 44);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return valid for larger sizes', () => {
      const result = validateTouchTargetSize(100, 60);

      expect(result.valid).toBe(true);
    });

    it('should return invalid when width is too small', () => {
      const result = validateTouchTargetSize(30, 50);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('30x50');
      expect(result.message).toContain('below minimum');
    });

    it('should return invalid when height is too small', () => {
      const result = validateTouchTargetSize(50, 30);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('50x30');
    });

    it('should return invalid when both dimensions are too small', () => {
      const result = validateTouchTargetSize(20, 20);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('20x20');
    });

    it('should include minimum size in error message', () => {
      const result = validateTouchTargetSize(10, 10);

      expect(result.message).toContain('44x44');
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21 for black on white (maximum contrast)', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');

      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 21 for white on black', () => {
      const ratio = getContrastRatio('#FFFFFF', '#000000');

      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1 for same colors (no contrast)', () => {
      const ratio = getContrastRatio('#FF0000', '#FF0000');

      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should calculate gray on white contrast', () => {
      // #767676 on white is exactly 4.54:1 (WCAG AA threshold)
      const ratio = getContrastRatio('#767676', '#FFFFFF');

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should handle lowercase hex', () => {
      const ratio = getContrastRatio('#ffffff', '#000000');

      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should handle hex without #', () => {
      const ratio = getContrastRatio('000000', 'FFFFFF');

      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return reasonable ratio for common color combinations', () => {
      // Navy blue on white
      const navyWhite = getContrastRatio('#000080', '#FFFFFF');
      expect(navyWhite).toBeGreaterThan(7);

      // Red on white
      const redWhite = getContrastRatio('#FF0000', '#FFFFFF');
      expect(redWhite).toBeGreaterThan(3);
      expect(redWhite).toBeLessThan(5);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should pass for black on white (normal text)', () => {
      const meets = meetsWCAGAA('#000000', '#FFFFFF');

      expect(meets).toBe(true);
    });

    it('should pass for white on black (normal text)', () => {
      const meets = meetsWCAGAA('#FFFFFF', '#000000');

      expect(meets).toBe(true);
    });

    it('should fail for light gray on white (normal text)', () => {
      // #AAAAAA on white is about 2.32:1
      const meets = meetsWCAGAA('#AAAAAA', '#FFFFFF');

      expect(meets).toBe(false);
    });

    it('should require 4.5:1 ratio for normal text', () => {
      // #767676 on white is ~4.54:1, just above threshold
      const meetsAbove = meetsWCAGAA('#767676', '#FFFFFF');
      expect(meetsAbove).toBe(true);

      // #777777 on white is ~4.48:1, just below threshold
      const meetsBelow = meetsWCAGAA('#787878', '#FFFFFF');
      expect(meetsBelow).toBe(false);
    });

    it('should require only 3:1 ratio for large text', () => {
      // #909090 on white is about 3.5:1 - passes large text but not normal text
      const meetsNormal = meetsWCAGAA('#909090', '#FFFFFF', false);
      const meetsLarge = meetsWCAGAA('#909090', '#FFFFFF', true);

      expect(meetsNormal).toBe(false);
      expect(meetsLarge).toBe(true);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('should pass for black on white (normal text)', () => {
      const meets = meetsWCAGAAA('#000000', '#FFFFFF');

      expect(meets).toBe(true);
    });

    it('should fail for medium gray on white (normal text)', () => {
      // #767676 on white is ~4.54:1, below AAA's 7:1
      const meets = meetsWCAGAAA('#767676', '#FFFFFF');

      expect(meets).toBe(false);
    });

    it('should require 7:1 ratio for normal text', () => {
      // #595959 on white is ~7.0:1
      const meets = meetsWCAGAAA('#595959', '#FFFFFF');
      expect(meets).toBe(true);
    });

    it('should require only 4.5:1 ratio for large text', () => {
      // #767676 on white is ~4.54:1
      const meetsNormal = meetsWCAGAAA('#767676', '#FFFFFF', false);
      const meetsLarge = meetsWCAGAAA('#767676', '#FFFFFF', true);

      expect(meetsNormal).toBe(false);
      expect(meetsLarge).toBe(true);
    });
  });

  describe('formatFileSizeA11y', () => {
    const fileSizeTestCases = [
      { bytes: 0, expected: '0 bytes' },
      { bytes: 500, expected: '500 bytes' },
      { bytes: 1024, expected: '1 kilobytes' },
      { bytes: 1536, expected: '1.5 kilobytes' },
      { bytes: 1048576, expected: '1 megabytes' },
      { bytes: 52428800, expected: '50 megabytes' },
      { bytes: 1073741824, expected: '1 gigabytes' },
    ];

    it.each(fileSizeTestCases)(
      'should format $bytes bytes as "$expected"',
      ({ bytes, expected }) => {
        expect(formatFileSizeA11y(bytes)).toBe(expected);
      }
    );

    it('should round to 2 decimal places', () => {
      const formatted = formatFileSizeA11y(1234567); // ~1.18 MB
      expect(formatted).toMatch(/^\d+\.\d{1,2} megabytes$/);
    });
  });

  describe('formatCountA11y', () => {
    it('should format singular (count of 1)', () => {
      const formatted = formatCountA11y(1, 'guide');

      expect(formatted).toBe('1 guide');
    });

    it('should format plural (count of 0)', () => {
      const formatted = formatCountA11y(0, 'guide');

      expect(formatted).toBe('0 guides');
    });

    it('should format plural (count > 1)', () => {
      const formatted = formatCountA11y(5, 'guide');

      expect(formatted).toBe('5 guides');
    });

    it('should use custom plural form', () => {
      const formatted = formatCountA11y(3, 'child', 'children');

      expect(formatted).toBe('3 children');
    });

    it('should use custom plural for singular', () => {
      const formatted = formatCountA11y(1, 'child', 'children');

      expect(formatted).toBe('1 child');
    });

    it('should handle large numbers', () => {
      const formatted = formatCountA11y(1000000, 'item');

      expect(formatted).toBe('1000000 items');
    });

    it('should handle negative numbers', () => {
      const formatted = formatCountA11y(-1, 'item');

      // -1 is not equal to 1, so plural form
      expect(formatted).toBe('-1 items');
    });
  });
});
