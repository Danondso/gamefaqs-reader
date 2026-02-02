/**
 * SearchBar - In-guide search component
 *
 * Search input with prev/next navigation and match counter.
 * Classic GameFAQs styling with simple layout.
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export interface SearchBarProps {
  visible: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  currentMatchIndex: number;
  totalMatches: number;
  hasMatches: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  visible,
  searchQuery,
  onSearchChange,
  onClose,
  onPrevious,
  onNext,
  currentMatchIndex,
  totalMatches,
  hasMatches,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {/* Search Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search in guide..."
          placeholderTextColor={theme.colors.textSecondary}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Search in guide"
          accessibilityHint="Enter text to search within this guide"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Match Counter and Navigation */}
      {searchQuery.length > 0 && (
        <View style={styles.controls}>
          <Text
            style={[
              styles.matchCount,
              {
                color: hasMatches ? theme.colors.text : theme.colors.error,
                fontSize: theme.typography.fontSize.xs,
              },
            ]}
            accessibilityLiveRegion="polite"
            accessibilityLabel={
              hasMatches
                ? `Match ${currentMatchIndex + 1} of ${totalMatches}`
                : 'No matches found'
            }
          >
            {hasMatches ? `${currentMatchIndex + 1}/${totalMatches}` : 'No matches'}
          </Text>

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              onPress={onPrevious}
              disabled={!hasMatches}
              style={[
                styles.navButton,
                !hasMatches && styles.navButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Previous match"
              accessibilityHint="Navigate to previous search result"
            >
              <Ionicons
                name="chevron-up"
                size={20}
                color={hasMatches ? theme.colors.link : theme.colors.border}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNext}
              disabled={!hasMatches}
              style={[
                styles.navButton,
                !hasMatches && styles.navButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Next match"
              accessibilityHint="Navigate to next search result"
            >
              <Ionicons
                name="chevron-down"
                size={20}
                color={hasMatches ? theme.colors.link : theme.colors.border}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Close Button */}
      <TouchableOpacity
        onPress={onClose}
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel="Close search"
      >
        <Ionicons name="close" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  clearButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  matchCount: {
    marginRight: 8,
    minWidth: 60,
    textAlign: 'right',
  },
  navigationButtons: {
    flexDirection: 'row',
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
