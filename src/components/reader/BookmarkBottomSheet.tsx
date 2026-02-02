/**
 * BookmarkBottomSheet - Animated bottom sheet for bookmark list
 *
 * Slides up from bottom with bookmark list, allows navigation and deletion.
 * Classic GameFAQs styling with simple list layout.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Bookmark } from '../../types';

export interface BookmarkBottomSheetProps {
  visible: boolean;
  bookmarks: Bookmark[];
  onClose: () => void;
  onBookmarkPress: (position: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}

export const BookmarkBottomSheet: React.FC<BookmarkBottomSheetProps> = ({
  visible,
  bookmarks,
  onClose,
  onBookmarkPress,
  onDeleteBookmark,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(1)).current; // Start at 1 (off-screen)
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  useEffect(() => {
    if (visible) {
      // Show modal first, then animate
      setIsModalVisible(true);
      // Small delay to ensure modal is mounted before animation
      setTimeout(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }).start();
      }, 10);
    } else {
      // Animate out, then hide modal
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [visible, slideAnim]);

  const renderBookmarkItem = ({ item }: { item: Bookmark }) => (
    <View
      style={[
        styles.bookmarkItem,
        {
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bookmarkContent}
        onPress={() => {
          onBookmarkPress(item.position);
          onClose();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Bookmark: ${item.name || 'Unnamed'} at position ${item.position}`}
        accessibilityHint="Double tap to navigate to this bookmark"
      >
        <Text
          style={[
            styles.bookmarkTitle,
            {
              color: theme.colors.link,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
        >
          {item.name || 'Unnamed Bookmark'}
        </Text>
        {item.page_reference ? (
          <Text
            style={[
              styles.bookmarkNotes,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.xs,
              },
            ]}
            numberOfLines={2}
          >
            {item.page_reference}
          </Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDeleteBookmark(item.id)}
        style={styles.deleteButton}
        accessibilityRole="button"
        accessibilityLabel={`Delete bookmark ${item.name || 'Unnamed'}`}
        accessibilityHint="Double tap to delete this bookmark"
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (!isModalVisible) {
    return null;
  }

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close bookmarks bottom sheet"
        >
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1000],
                    }),
                  },
                ],
              },
            ]}
            onStartShouldSetResponder={() => true} // Prevent backdrop close when tapping sheet
          >
            <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
              {/* Header */}
              <View
                style={[
                  styles.header,
                  {
                    borderBottomColor: theme.colors.border,
                  },
                ]}
            >
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                  },
                ]}
                accessibilityRole="header"
              >
                Bookmarks
              </Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close bookmarks"
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Bookmark List */}
            {bookmarks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSize.sm,
                    },
                  ]}
                >
                  No bookmarks yet
                </Text>
                </View>
              ) : (
                <FlatList
                  data={bookmarks}
                  renderItem={renderBookmarkItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  accessibilityRole="list"
                />
              )}
            </SafeAreaView>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    height: '67%', // 2/3 of screen
    width: '100%',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  listContent: {
    paddingVertical: 8,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  bookmarkContent: {
    flex: 1,
    marginRight: 8,
  },
  bookmarkTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  bookmarkNotes: {
    lineHeight: 18,
  },
  deleteButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
  },
});
