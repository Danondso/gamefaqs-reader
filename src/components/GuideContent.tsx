import React, { useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';

// Shared constant for line height calculation - must match across components
export const LINE_HEIGHT_MULTIPLIER = 1.4;

interface GuideContentProps {
  content: string;
  fontSize?: number;
  searchQuery?: string;
  currentMatchIndex?: number;
  onScroll?: (position: number) => void;
  contentPadding?: number;
}

export interface GuideContentRef {
  scrollToPosition: (position: number, animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
}

/**
 * Component for rendering guide content with proper formatting
 * Preserves ASCII art and supports monospace font
 * Uses FlashList for virtualized rendering of large content
 */
const GuideContent = forwardRef<GuideContentRef, GuideContentProps>(({
  content,
  fontSize = 14,
  searchQuery,
  currentMatchIndex = 0,
  onScroll,
  contentPadding = 16,
}, ref) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const listRef = useRef<FlashListRef<string>>(null);

  const lineHeight = Math.round(fontSize * LINE_HEIGHT_MULTIPLIER);

  // Expose scroll methods to parent
  useImperativeHandle(ref, () => ({
    scrollToPosition: (position: number, animated = true) => {
      const lineIndex = Math.floor(position / lineHeight);
      listRef.current?.scrollToIndex({ index: lineIndex, animated });
    },
    scrollToEnd: (animated = true) => {
      listRef.current?.scrollToEnd({ animated });
    },
  }), [lineHeight]);

  // Normalize line endings and split into lines
  const lines = useMemo(() => {
    const normalized = content?.replace(/\r\n/g, '\n').replace(/\r/g, '\n') || '';
    return normalized.split('\n');
  }, [content]);

  // Render a line with optional search highlighting
  const renderLine = useCallback(({ item: line, index }: { item: string; index: number }) => {
    const textStyle = {
      fontSize,
      lineHeight,
      color: isDark ? '#FFFFFF' : '#000000',
    };

    // Handle empty lines - need to render something for proper spacing
    if (!line) {
      return (
        <Text style={[styles.content, textStyle]}>{' '}</Text>
      );
    }

    if (!searchQuery || searchQuery.trim() === '') {
      return (
        <Text style={[styles.content, textStyle]}>{line}</Text>
      );
    }

    // Search highlighting
    const parts: React.ReactNode[] = [];
    const lowerLine = line.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    let lastIndex = 0;
    let matchCount = 0;

    let idx = lowerLine.indexOf(lowerQuery);
    while (idx !== -1) {
      if (idx > lastIndex) {
        parts.push(line.substring(lastIndex, idx));
      }

      const matchText = line.substring(idx, idx + searchQuery.length);
      parts.push(
        <Text
          key={`match-${index}-${matchCount}`}
          style={[
            styles.highlight,
            {
              backgroundColor: '#FFD700',
              color: '#000000',
            },
          ]}
        >
          {matchText}
        </Text>
      );

      matchCount++;
      lastIndex = idx + searchQuery.length;
      idx = lowerLine.indexOf(lowerQuery, lastIndex);
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <Text style={[styles.content, textStyle]}>
        {parts.length > 0 ? parts : line}
      </Text>
    );
  }, [fontSize, lineHeight, isDark, searchQuery]);

  const keyExtractor = useCallback((_item: string, index: number) => `line-${index}`, []);

  const handleScroll = useCallback((event: any) => {
    const position = event.nativeEvent.contentOffset.y;
    onScroll?.(Math.round(position));
  }, [onScroll]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
      ]}
    >
      <FlashList
        ref={listRef}
        data={lines}
        renderItem={renderLine}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: contentPadding,
          paddingTop: contentPadding,
          paddingBottom: 500, // Extra space for bookmarking at end
        }}
      />
    </View>
  );
});

GuideContent.displayName = 'GuideContent';

export default GuideContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    fontFamily: 'Courier', // Monospace font for ASCII art preservation
    letterSpacing: 0,
  },
  highlight: {
    fontFamily: 'Courier',
    fontWeight: '700',
  },
});
