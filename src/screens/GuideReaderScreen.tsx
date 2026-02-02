/**
 * GuideReaderScreen - Main guide reading screen (REFACTORED)
 *
 * Reduced from 1412 lines to ~300 lines by extracting logic into
 * custom hooks and components.
 *
 * Features:
 * - Guide loading with scroll position auto-save
 * - Bookmarks with sidebar
 * - In-guide search with highlighting
 * - Font size adjustment
 * - Metadata editing
 * - Classic GameFAQs styling
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { GuideContent, GuideContentRef } from '../components';
import { FontControls } from '../components/reader/FontControls';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { BookmarkBottomSheet } from '../components/reader/BookmarkBottomSheet';
import { SearchBar } from '../components/reader/SearchBar';
import { BookmarkDialog } from '../components/reader/BookmarkDialog';
import { MetadataDialog } from '../components/reader/MetadataDialog';
import { Toast } from '../components/Toast';
import { DownloadManager } from '../services/DownloadManager';
import { useGuideReader } from '../hooks/useGuideReader';
import { useBookmarks } from '../hooks/useBookmarks';
import { useGuideSearch } from '../hooks/useGuideSearch';
import { useToast } from '../hooks/useToast';
import { RootTabParamList } from '../types/navigation';

type GuideReaderScreenRouteProp = RouteProp<RootTabParamList, 'Reader'>;
type GuideReaderScreenNavigationProp = StackNavigationProp<RootTabParamList, 'Reader'>;

interface GuideReaderScreenProps {
  route?: GuideReaderScreenRouteProp;
}

export default function GuideReaderScreen({ route }: GuideReaderScreenProps) {
  const guideId = route?.params?.guideId;
  const navigation = useNavigation<GuideReaderScreenNavigationProp>();
  const { theme } = useTheme();
  const { showSuccess, showError, toastProps } = useToast();

  // Guide loading and scroll position
  const {
    guide,
    loading,
    error,
    scrollPosition,
    setScrollPosition,
    saveScrollPosition,
    updateMetadata,
    reload: reloadGuide,
  } = useGuideReader(guideId);

  // Bookmarks management
  const {
    bookmarks,
    createBookmark,
    deleteBookmark,
    reload: reloadBookmarks,
  } = useBookmarks(guideId);

  // In-guide search
  const {
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    currentMatchPosition,
    hasMatches,
    totalMatches,
    goToNextMatch,
    goToPreviousMatch,
    clearSearch,
  } = useGuideSearch(guide?.content || '');

  // Local UI state
  const [fontSize, setFontSize] = useState(8);
  const [showBookmarkSidebar, setShowBookmarkSidebar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // GuideContent ref for programmatic scrolling
  const guideContentRef = useRef<GuideContentRef>(null);

  // Track programmatic scrolls to prevent onScroll from overwriting target position
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if guide is downloaded on load
  useEffect(() => {
    if (guideId) {
      DownloadManager.isDownloaded(guideId)
        .then(setIsDownloaded)
        .catch((error) => {
          if (__DEV__) console.error('Failed to check download status:', error);
        });
    }
  }, [guideId]);

  // Check if a bookmark exists near the current scroll position
  const bookmarkAtPosition = useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) return null;
    // Find bookmark within 50px of current position
    const threshold = 50;
    return bookmarks.find(
      (b) => Math.abs(b.position - scrollPosition) < threshold && !b.is_last_read
    ) || null;
  }, [bookmarks, scrollPosition]);

  // Find previous and next bookmarks relative to current scroll position
  const { previousBookmark, nextBookmark } = useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) {
      return { previousBookmark: null, nextBookmark: null };
    }

    // Sort bookmarks by position
    const sortedBookmarks = [...bookmarks].sort((a, b) => a.position - b.position);

    // Find bookmarks before and after current position (with some threshold to avoid current position)
    const threshold = 50;
    const before = sortedBookmarks.filter((b) => b.position < scrollPosition - threshold);
    const after = sortedBookmarks.filter((b) => b.position > scrollPosition + threshold);

    return {
      previousBookmark: before.length > 0 ? before[before.length - 1] : null,
      nextBookmark: after.length > 0 ? after[0] : null,
    };
  }, [bookmarks, scrollPosition]);


  // Update navigation header with guide title
  useEffect(() => {
    if (guide) {
      navigation.setOptions({
        title: guide.title,
        headerBackTitle: '',
      });
    }
  }, [guide, navigation]);

  // Refs to hold latest values for unmount cleanup
  const scrollPositionRef = useRef(scrollPosition);
  const saveScrollPositionRef = useRef(saveScrollPosition);
  useEffect(() => {
    scrollPositionRef.current = scrollPosition;
  }, [scrollPosition]);
  useEffect(() => {
    saveScrollPositionRef.current = saveScrollPosition;
  }, [saveScrollPosition]);

  // Auto-save scroll position with debounce
  useEffect(() => {
    if (!guideId || scrollPosition === 0) return;

    const timeoutId = setTimeout(() => {
      saveScrollPosition(scrollPosition);
    }, 2000); // Save 2 seconds after scrolling stops

    return () => clearTimeout(timeoutId);
  }, [scrollPosition, guideId, saveScrollPosition]);

  // Save on unmount only (use refs to avoid re-running effect)
  useEffect(() => {
    return () => {
      if (guideId && scrollPositionRef.current > 0) {
        saveScrollPositionRef.current(scrollPositionRef.current);
      }
      // Clean up programmatic scroll timeout
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideId]);

  // Scroll to search match when it changes
  useEffect(() => {
    if (currentMatchPosition !== undefined) {
      // Clear any existing timeout
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }

      // Set position and mark as programmatic scroll
      setScrollPosition(currentMatchPosition);
      isProgrammaticScrollRef.current = true;

      guideContentRef.current?.scrollToPosition(currentMatchPosition, true);

      // Re-enable scroll updates after animation
      programmaticScrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    }
  }, [currentMatchPosition, setScrollPosition]);

  // Font size controls
  const handleIncreaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 24));
  };

  const handleDecreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 6));
  };

  // Bookmark handlers
  const handleOpenBookmarkDialog = () => {
    setShowBookmarkDialog(true);
  };

  const handleSaveBookmark = async (title: string, notes?: string) => {
    try {
      await createBookmark(title, scrollPosition, notes);
      showSuccess('Bookmark created');
      handleCloseBookmarkDialog();
    } catch (error) {
      showError('Failed to create bookmark');
      if (__DEV__) console.error('Failed to create bookmark:', error);
    }
  };

  const handleCloseBookmarkDialog = () => {
    setShowBookmarkDialog(false);
  };

  // Helper for programmatic scrolling - suppresses onScroll updates during animation
  const scrollToPositionProgrammatically = (position: number, animated = true) => {
    // Clear any existing timeout
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }

    // Set the position immediately and mark as programmatic scroll
    setScrollPosition(position);
    isProgrammaticScrollRef.current = true;

    // Perform the scroll
    guideContentRef.current?.scrollToPosition(position, animated);

    // Re-enable scroll updates after animation completes (500ms should cover most animations)
    programmaticScrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  };

  const handleNavigateToBookmark = (position: number) => {
    scrollToPositionProgrammatically(position);
    setShowBookmarkSidebar(false);
  };

  const handlePreviousBookmark = () => {
    if (previousBookmark) {
      scrollToPositionProgrammatically(previousBookmark.position);
    } else {
      // No previous bookmark - jump to beginning
      scrollToPositionProgrammatically(0);
    }
  };

  const handleNextBookmark = () => {
    if (nextBookmark) {
      scrollToPositionProgrammatically(nextBookmark.position);
    } else {
      // No next bookmark - jump to end
      // Clear any existing timeout
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
      isProgrammaticScrollRef.current = true;
      guideContentRef.current?.scrollToEnd(true);
      programmaticScrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    }
  };

  // Jump to start/end of document for bookmarking
  const handleJumpToStart = () => {
    scrollToPositionProgrammatically(0);
  };

  const handleJumpToEnd = () => {
    guideContentRef.current?.scrollToEnd(true);
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await deleteBookmark(bookmarkId);
      showSuccess('Bookmark deleted');
    } catch (error) {
      showError('Failed to delete bookmark');
      if (__DEV__) console.error('Failed to delete bookmark:', error);
    }
  };

  // Search handlers
  const handleOpenSearch = () => {
    setShowSearch(true);
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    clearSearch();
  };

  // Metadata handlers
  const handleOpenMetadataDialog = () => {
    setShowMetadataDialog(true);
  };

  const handleSaveMetadata = async (updates: {
    title?: string;
    author?: string;
    platform?: string;
    tags?: string;
  }) => {
    try {
      await updateMetadata(updates);
      showSuccess('Guide information updated');
      setShowMetadataDialog(false);
    } catch (error) {
      showError('Failed to update guide information');
      if (__DEV__) console.error('Failed to update metadata:', error);
    }
  };

  // Toolbar handlers
  const handleSearchPress = () => {
    handleOpenSearch();
  };

  const handleEditPress = () => {
    handleOpenMetadataDialog();
  };

  const handleBookmarksPress = () => {
    setShowBookmarkSidebar(true);
  };

  const handleDownloadPress = async () => {
    if (!guideId || isDownloaded || isDownloading) return;

    setIsDownloading(true);
    try {
      await DownloadManager.downloadGuide(guideId);
      setIsDownloaded(true);
      showSuccess('Guide saved for offline reading');
    } catch (error) {
      showError('Failed to download guide');
      if (__DEV__) console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle scroll events - always use integer positions
  // Skip updates during programmatic scrolls to prevent overwriting target position
  const handleScroll = (position: number) => {
    if (isProgrammaticScrollRef.current) return;
    setScrollPosition(Math.round(position));
  };

  // Loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <LoadingState message="Loading guide..." />
      </View>
    );
  }

  // Error state
  if (error || !guide) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ErrorState
          title="Error Loading Guide"
          message={error || 'Guide not found'}
          onRetry={reloadGuide}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* Toolbar */}
      <ReaderToolbar
        onSearchPress={handleSearchPress}
        onEditPress={handleEditPress}
        onBookmarksPress={handleBookmarksPress}
        onDownloadPress={handleDownloadPress}
        isDownloaded={isDownloaded}
        isDownloading={isDownloading}
      />

      {/* Search Bar */}
      {showSearch && (
        <SearchBar
          visible={showSearch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={handleCloseSearch}
          onPrevious={goToPreviousMatch}
          onNext={goToNextMatch}
          currentMatchIndex={currentMatchIndex}
          totalMatches={totalMatches}
          hasMatches={hasMatches}
        />
      )}

      {/* Font Controls */}
      <FontControls
        fontSize={fontSize}
        onIncrease={handleIncreaseFontSize}
        onDecrease={handleDecreaseFontSize}
        onPreviousBookmark={handlePreviousBookmark}
        onNextBookmark={handleNextBookmark}
        hasPreviousBookmark={true}
        hasNextBookmark={true}
      />

      {/* Guide Content */}
      <View style={styles.readerContainer}>
        {/* Left-side bookmark button - tap to create bookmark at current position */}
        <View
          style={[
            styles.bookmarkIndicatorTrack,
            { backgroundColor: theme.colors.primary + '40' }, // Primary color with 25% opacity
          ]}
        >
          <TouchableOpacity
            style={[
              styles.bookmarkIndicator,
              {
                backgroundColor: 'transparent',
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={handleOpenBookmarkDialog}
            accessibilityRole="button"
            accessibilityLabel={bookmarkAtPosition ? "Edit bookmark at current position" : "Add bookmark at current position"}
            accessibilityHint="Tap to create or view bookmark at this reading position"
          >
            <View
              style={[
                styles.bookmarkPointer,
                {
                  borderLeftColor: theme.colors.primary,
                },
              ]}
            />
            <Ionicons
              name={bookmarkAtPosition ? 'bookmark' : 'bookmark-outline'}
              size={Platform.OS === 'android' ? 18 : 22}
              color={theme.colors.primary}
              style={styles.bookmarkIndicatorIcon}
            />
          </TouchableOpacity>
        </View>

        <GuideContent
          ref={guideContentRef}
          content={guide.content}
          fontSize={fontSize}
          searchQuery={searchQuery}
          currentMatchIndex={currentMatchIndex}
          onScroll={handleScroll}
        />
      </View>

      {/* Bookmark Bottom Sheet */}
      <BookmarkBottomSheet
        visible={showBookmarkSidebar}
        bookmarks={bookmarks}
        onClose={() => setShowBookmarkSidebar(false)}
        onBookmarkPress={handleNavigateToBookmark}
        onDeleteBookmark={handleDeleteBookmark}
      />

      {/* Bookmark Dialog */}
      <BookmarkDialog
        visible={showBookmarkDialog}
        onClose={handleCloseBookmarkDialog}
        onSave={handleSaveBookmark}
      />

      {/* Metadata Dialog */}
      <MetadataDialog
        visible={showMetadataDialog}
        guide={guide}
        onClose={() => setShowMetadataDialog(false)}
        onSave={handleSaveMetadata}
      />

      {/* Toast Notifications */}
      <Toast {...toastProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  readerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  bookmarkIndicatorTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 10,
  },
  bookmarkIndicator: {
    position: 'absolute',
    left: 0,
    top: 8, // Slight offset from top for visual balance
    zIndex: 11,
    ...Platform.select({
      ios: {
        width: 44,
        height: 44,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        width: 36,
        height: 36,
        // No elevation - it causes gray background on transparent views
      },
    }),
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkPointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    ...Platform.select({
      ios: {
        right: -10,
        borderTopWidth: 10,
        borderBottomWidth: 10,
        borderLeftWidth: 10,
      },
      android: {
        right: -8,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderLeftWidth: 8,
      },
    }),
  },
  bookmarkIndicatorIcon: {
    marginLeft: 4,
  },
});
