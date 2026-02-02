/**
 * SearchScreen - Full-text search for guides (API-first)
 *
 * Uses server-side search via TanStack Query.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState, TableRow, LinkButton } from '../components';
import { useDebounce } from '../hooks/useDebounce';
import { useGuidesSearch } from '../hooks/queries/useGuides';
import { useNetworkStatus } from '../providers/NetworkProvider';
import type { RootStackParamList } from '../types/navigation';
import type { GuideSummary } from '../api/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'GuideReader'>;

const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Use API search
  const { data: searchData, isLoading: loading } = useGuidesSearch(debouncedQuery, 50);

  // Combine guides and content results
  const results: GuideSummary[] = searchData
    ? [...searchData.guides, ...searchData.content]
    : [];

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Save recent search when we get results
  useEffect(() => {
    if (results.length > 0 && debouncedQuery.trim().length > 0) {
      saveRecentSearch(debouncedQuery);
    }
  }, [results.length, debouncedQuery]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) return;

      const updated = [
        trimmed,
        ...recentSearches.filter((q) => q !== trimmed),
      ].slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      if (__DEV__) console.error('Failed to save recent search:', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
  };

  const handleResultPress = (guideId: string) => {
    navigation.navigate('GuideReader', { guideId });
  };

  const renderSearchBar = () => (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          padding: theme.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.searchInputContainer,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isOnline ? 'Search guides by title or content...' : 'Search requires internet connection'}
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          editable={isOnline}
          accessibilityLabel="Search guides by title or content"
          accessibilityRole="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={clearSearch}
            style={styles.clearButton}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.clearButtonText,
                { color: theme.colors.link },
              ]}
            >
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderResult = ({ item }: { item: GuideSummary }) => {
    let author = 'Unknown';
    try {
      if (item.metadata) {
        const meta = JSON.parse(item.metadata);
        author = meta.author || 'Unknown';
      }
    } catch {}

    return (
      <TableRow
        onPress={() => handleResultPress(item.id)}
        accessibilityLabel={`${item.title} guide`}
        accessibilityHint="Double tap to read guide"
      >
        <Text
          style={[
            styles.resultTitle,
            {
              color: theme.colors.link,
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.bold,
            },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.resultSnippet,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
              marginTop: theme.spacing.xs,
            },
          ]}
          numberOfLines={1}
        >
          by {author}
        </Text>
      </TableRow>
    );
  };

  const renderRecentSearches = () => {
    if (searchQuery.length > 0 || recentSearches.length === 0) {
      return null;
    }

    return (
      <View style={{ padding: theme.spacing.md }}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          Recent Searches
        </Text>
        {recentSearches.map((query, index) => (
          <View key={index}>
            <LinkButton
              title={query}
              onPress={() => handleRecentSearchPress(query)}
              style={{ marginVertical: theme.spacing.xs }}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    // Offline state
    if (!isOnline) {
      return (
        <EmptyState
          title="Search Unavailable"
          message="Connect to the internet to search guides"
        />
      );
    }

    // Show recent searches if no search query
    if (searchQuery.trim().length === 0) {
      return renderRecentSearches();
    }

    // Require at least 2 characters
    if (searchQuery.trim().length < 2) {
      return (
        <View style={styles.centerContainer}>
          <Text
            style={[
              styles.loadingText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            Enter at least 2 characters to search
          </Text>
        </View>
      );
    }

    // Show loading
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text
            style={[
              styles.loadingText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            Searching...
          </Text>
        </View>
      );
    }

    // Show empty state if no results
    if (results.length === 0 && debouncedQuery.trim().length >= 2) {
      return (
        <EmptyState
          title="No results found"
          message={`No guides match "${debouncedQuery}"`}
        />
      );
    }

    // Show results
    return (
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: theme.colors.background }}
        ListHeaderComponent={
          results.length > 0 ? (
            <View
              style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text
                style={[
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
                accessibilityLiveRegion="polite"
              >
                {results.length} {results.length === 1 ? 'result' : 'results'} found
              </Text>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderSearchBar()}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearButtonText: {
    fontWeight: '600',
  },
  resultTitle: {
    marginBottom: 4,
  },
  resultSnippet: {
    lineHeight: 20,
  },
  sectionTitle: {},
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    textAlign: 'center',
  },
});
