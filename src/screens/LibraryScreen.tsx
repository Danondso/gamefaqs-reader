/**
 * LibraryScreen - Guide library with filtering and search (API-first)
 *
 * Uses TanStack Query for data fetching with offline support
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Tag } from '../components/Tag';
import { useDebounce } from '../hooks/useDebounce';
import { useGuidesInfinite, useGuidesSearch } from '../hooks/queries/useGuides';
import { useNetworkStatus } from '../providers/NetworkProvider';
import type { GuideSummary } from '../api/types';

interface ParsedGuideMetadata {
  author: string;
  platform: string | null;
  tags: string[];
}

interface GuideItemProps {
  item: GuideSummary;
  metadata: ParsedGuideMetadata;
  onPress: (guideId: string) => void;
  isDownloaded?: boolean;
}

// Memoized guide item component for better performance
const GuideItem = React.memo<GuideItemProps>(({ item, metadata, onPress, isDownloaded }) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.guideItem,
        {
          backgroundColor: isPressed ? theme.colors.primary : theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
      activeOpacity={1}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} guide${metadata.platform ? ` for ${metadata.platform}` : ''}`}
      accessibilityHint="Double tap to read guide"
    >
      <View style={styles.guideTitleRow}>
        <Text
          style={[
            styles.guideTitle,
            {
              color: isPressed ? theme.colors.background : theme.colors.text,
              fontSize: theme.typography.fontSize.md,
            },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {isDownloaded && (
          <Ionicons
            name="cloud-download"
            size={16}
            color={isPressed ? theme.colors.background : theme.colors.primary}
            style={styles.downloadedIcon}
          />
        )}
      </View>
      <Text
        style={[
          styles.guideAuthor,
          {
            color: isPressed ? theme.colors.background : theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          },
        ]}
      >
        by {metadata.author}
      </Text>
      {metadata.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {metadata.tags.slice(0, 3).map((tag: string, index: number) => (
            <Tag
              key={index}
              label={tag}
              size="small"
              variant={isPressed ? 'default' : 'primary'}
            />
          ))}
          {metadata.tags.length > 3 && (
            <Text
              style={[
                styles.moreTagsText,
                {
                  color: isPressed ? theme.colors.background : theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                },
              ]}
            >
              +{metadata.tags.length - 3}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

GuideItem.displayName = 'GuideItem';

function parseMetadata(metadataStr: string | null | undefined): ParsedGuideMetadata {
  if (!metadataStr) {
    return { author: 'Unknown', platform: null, tags: [] };
  }
  try {
    const parsed = JSON.parse(metadataStr);
    return {
      author: parsed.author || 'Unknown',
      platform: parsed.platform || null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch {
    return { author: 'Unknown', platform: null, tags: [] };
  }
}

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch guides with infinite scroll
  const {
    data: guidesData,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGuidesInfinite(20);

  // Search query
  const { data: searchData, isLoading: isSearching } = useGuidesSearch(
    debouncedSearchQuery,
    50
  );

  // Flatten pages into single array, deduplicating by ID
  const allGuides = useMemo(() => {
    if (!guidesData?.pages) return [];
    const seen = new Set<string>();
    return guidesData.pages.flatMap((page) => page.data).filter((guide) => {
      if (seen.has(guide.id)) return false;
      seen.add(guide.id);
      return true;
    });
  }, [guidesData]);

  // Parse guide metadata
  const guidesWithMetadata = useMemo(() => {
    return allGuides.map((guide) => ({
      guide,
      metadata: parseMetadata(guide.metadata),
    }));
  }, [allGuides]);

  // Extract available platforms
  const availablePlatforms = useMemo(() => {
    const platformsSet = new Set<string>();
    guidesWithMetadata.forEach(({ metadata }) => {
      if (metadata.platform) {
        platformsSet.add(metadata.platform);
      }
    });
    return Array.from(platformsSet).sort();
  }, [guidesWithMetadata]);

  // Extract available tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    guidesWithMetadata.forEach(({ metadata }) => {
      metadata.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [guidesWithMetadata]);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return availableTags;
    const query = tagSearchQuery.toLowerCase();
    return availableTags.filter((tag) => tag.toLowerCase().includes(query));
  }, [availableTags, tagSearchQuery]);

  // Get display data (search results or filtered guides)
  const displayData = useMemo(() => {
    // If searching, use search results
    if (debouncedSearchQuery.trim().length >= 2 && searchData) {
      // Deduplicate by guide ID (a guide can match both title and content)
      const seenIds = new Set<string>();
      const uniqueGuides = [...searchData.guides, ...searchData.content].filter((guide) => {
        if (seenIds.has(guide.id)) return false;
        seenIds.add(guide.id);
        return true;
      });
      return uniqueGuides.map((guide) => ({
        guide,
        metadata: parseMetadata(guide.metadata),
      }));
    }

    // Otherwise use filtered guides
    let filtered = guidesWithMetadata;

    if (selectedPlatform) {
      filtered = filtered.filter(({ metadata }) => metadata.platform === selectedPlatform);
    }

    if (selectedTag) {
      filtered = filtered.filter(({ metadata }) => metadata.tags.includes(selectedTag));
    }

    return filtered;
  }, [guidesWithMetadata, selectedPlatform, selectedTag, debouncedSearchQuery, searchData]);

  const handleGuidePress = useCallback(
    (guideId: string) => {
      navigation.navigate('GuideReader', { guideId });
    },
    [navigation]
  );

  const handleLoadMore = useCallback(() => {
    // Only fetch more if we have a next page, aren't already fetching,
    // aren't searching, and have some data already loaded
    if (hasNextPage && !isFetchingNextPage && !debouncedSearchQuery && allGuides.length > 0) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, debouncedSearchQuery, allGuides.length]);

  // Memoized renderItem for FlatList
  const renderItem = useCallback(
    ({ item }: { item: { guide: GuideSummary; metadata: ParsedGuideMetadata } }) => (
      <GuideItem
        item={item.guide}
        metadata={item.metadata}
        onPress={handleGuidePress}
      />
    ),
    [handleGuidePress]
  );

  // Memoized keyExtractor
  const keyExtractor = useCallback(
    (item: { guide: GuideSummary; metadata: ParsedGuideMetadata }) => item.guide.id,
    []
  );

  // Footer component for loading more
  const ListFooterComponent = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, theme.colors.primary]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingState message="Loading guides..." />
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ErrorState
          title="Error Loading Guides"
          message={error?.message || 'Failed to load guides'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  // Empty state
  if (allGuides.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          title="No guides available"
          message={isOnline ? 'Check back later for guides' : 'Connect to the internet to browse guides'}
          actionTitle={!isOnline ? 'Go to Downloads' : undefined}
          onAction={!isOnline ? () => navigation.navigate('Downloads') : undefined}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      {/* Network Status Banner */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.colors.warning }]}>
          <Ionicons name="cloud-offline" size={16} color="#000" />
          <Text style={styles.offlineBannerText}>Offline - Viewing cached data</Text>
        </View>
      )}

      {/* Compact Filter Bar */}
      <View
        style={[
          styles.compactFilterBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {showSearch ? (
          /* Search Mode */
          <View style={styles.searchRow}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search guides..."
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              returnKeyType="search"
              accessibilityLabel="Search guides"
              accessibilityRole="search"
            />
            {isSearching && (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            )}
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              style={styles.searchCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Left side: Guide count and filters */}
            <View style={styles.filterLeft}>
              <Text
                style={[
                  styles.guideCount,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                  },
                ]}
                accessibilityLiveRegion="polite"
              >
                {displayData.length} {displayData.length === 1 ? 'guide' : 'guides'}
              </Text>

              {/* Platform Filter Button */}
              {availablePlatforms.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: selectedPlatform
                        ? theme.colors.primary
                        : theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowPlatformPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Filter by platform"
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      {
                        color: selectedPlatform
                          ? theme.colors.background
                          : theme.colors.text,
                        fontSize: theme.typography.fontSize.sm,
                      },
                    ]}
                  >
                    {selectedPlatform || 'Platform'}
                  </Text>
                  {selectedPlatform && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedPlatform(null);
                      }}
                      style={styles.clearButton}
                      accessibilityRole="button"
                      accessibilityLabel="Clear platform filter"
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={theme.colors.background}
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}

              {/* Tag Filter Button */}
              {availableTags.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: selectedTag
                        ? theme.colors.primary
                        : theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowTagPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Filter by tag"
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      {
                        color: selectedTag ? theme.colors.background : theme.colors.text,
                        fontSize: theme.typography.fontSize.sm,
                      },
                    ]}
                  >
                    {selectedTag || 'Tag'}
                  </Text>
                  {selectedTag && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedTag(null);
                      }}
                      style={styles.clearButton}
                      accessibilityRole="button"
                      accessibilityLabel="Clear tag filter"
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={theme.colors.background}
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Right side: Search button */}
            <View style={styles.filterRight}>
              <TouchableOpacity
                onPress={() => setShowSearch(true)}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Search guides"
              >
                <Ionicons name="search" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Guide List */}
      <FlatList
        data={displayData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={styles.listContent}
        accessibilityRole="list"
      />

      {/* Platform Picker Bottom Sheet */}
      {showPlatformPicker && (
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowPlatformPicker(false)}
        >
          <View
            style={[styles.pickerSheet, { backgroundColor: theme.colors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}
            >
              <Text
                style={[
                  styles.pickerTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                  },
                ]}
              >
                Filter by Platform
              </Text>
              <TouchableOpacity
                onPress={() => setShowPlatformPicker(false)}
                style={styles.pickerClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[null, ...availablePlatforms]}
              keyExtractor={(item) => item || 'all'}
              renderItem={({ item }) => {
                const isSelected = selectedPlatform === item;
                const label = item || 'All Platforms';
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.background,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPlatform(item);
                      setShowPlatformPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color: isSelected ? theme.colors.background : theme.colors.text,
                          fontSize: theme.typography.fontSize.md,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Tag Picker Bottom Sheet */}
      {showTagPicker && (
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => {
            setShowTagPicker(false);
            setTagSearchQuery('');
          }}
        >
          <View
            style={[styles.pickerSheet, { backgroundColor: theme.colors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}
            >
              <Text
                style={[
                  styles.pickerTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                  },
                ]}
              >
                Filter by Tag
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTagPicker(false);
                  setTagSearchQuery('');
                }}
                style={styles.pickerClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.tagSearchContainer, { borderBottomColor: theme.colors.border }]}>
              <TextInput
                style={[
                  styles.tagSearchInput,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
                value={tagSearchQuery}
                onChangeText={setTagSearchQuery}
                placeholder="Search tags..."
                placeholderTextColor={theme.colors.textSecondary}
                autoFocus
                returnKeyType="search"
                accessibilityLabel="Search tags"
              />
            </View>
            <FlatList
              data={[null, ...filteredTags]}
              keyExtractor={(item) => item || 'all-tags'}
              renderItem={({ item }) => {
                const isSelected = selectedTag === item;
                const label = item || 'All Tags';
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.background,
                      },
                    ]}
                    onPress={() => {
                      setSelectedTag(item);
                      setShowTagPicker(false);
                      setTagSearchQuery('');
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color: isSelected ? theme.colors.background : theme.colors.text,
                          fontSize: theme.typography.fontSize.md,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyTagSearch}>
                  <Text
                    style={[
                      styles.emptyTagSearchText,
                      { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm },
                    ]}
                  >
                    No tags match "{tagSearchQuery}"
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  compactFilterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  filterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchCloseButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCount: {
    fontWeight: '600',
    marginRight: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  filterButtonText: {
    fontWeight: '600',
  },
  clearButton: {
    marginLeft: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
  guideItem: {
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  guideTitle: {
    fontWeight: '600',
    marginBottom: 4,
    flex: 1,
  },
  downloadedIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  guideAuthor: {
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  moreTagsText: {
    marginLeft: 4,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    height: '66%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
  },
  pickerTitle: {
    fontWeight: '700',
  },
  pickerClose: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerItemText: {
    fontWeight: '500',
  },
  tagSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tagSearchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyTagSearch: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTagSearchText: {
    textAlign: 'center',
  },
});
