/**
 * DownloadsScreen - Manage offline downloaded guides
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { DownloadManager } from '../services/DownloadManager';
import { useNetworkStatus } from '../providers/NetworkProvider';
import type { Guide } from '../types';

interface DownloadedGuide extends Guide {
  downloaded_at: number;
}

export default function DownloadsScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();

  const [guides, setGuides] = useState<DownloadedGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDownloadedGuides();
  }, []);

  const loadDownloadedGuides = async () => {
    try {
      setLoading(true);
      const downloaded = await DownloadManager.getDownloadedGuides();
      setGuides(downloaded);
    } catch (error) {
      if (__DEV__) console.error('Failed to load downloaded guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDownloadedGuides();
    setRefreshing(false);
  }, []);

  const handleGuidePress = useCallback(
    (guideId: string) => {
      navigation.navigate('GuideReader', { guideId });
    },
    [navigation]
  );

  const handleDeleteGuide = useCallback(
    (guide: DownloadedGuide) => {
      Alert.alert(
        'Remove Download',
        `Remove "${guide.title}" from offline storage?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await DownloadManager.removeGuide(guide.id);
                setGuides((prev) => prev.filter((g) => g.id !== guide.id));
              } catch (error) {
                Alert.alert('Error', 'Failed to remove guide');
              }
            },
          },
        ]
      );
    },
    []
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSize = (contentLength: number) => {
    const kb = contentLength / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderItem = useCallback(
    ({ item }: { item: DownloadedGuide }) => (
      <TouchableOpacity
        style={[
          styles.guideItem,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => handleGuidePress(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, downloaded ${formatDate(item.downloaded_at)}`}
      >
        <View style={styles.guideInfo}>
          <Text
            style={[
              styles.guideTitle,
              { color: theme.colors.text, fontSize: theme.typography.fontSize.md },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={styles.guideMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm },
                ]}
              >
                {formatDate(item.downloaded_at)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="document-outline" size={14} color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm },
                ]}
              >
                {formatSize(item.content.length)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteGuide(item)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.title} from downloads`}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [theme, handleGuidePress, handleDeleteGuide]
  );

  const keyExtractor = useCallback((item: DownloadedGuide) => item.id, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingState message="Loading downloads..." />
      </View>
    );
  }

  if (guides.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          title="No Downloaded Guides"
          message="Download guides from the library to read offline"
          actionTitle="Go to Library"
          onAction={() => navigation.navigate('Library')}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="cloud-download" size={24} color={theme.colors.primary} />
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text, fontSize: theme.typography.fontSize.lg },
            ]}
          >
            Downloads
          </Text>
        </View>
        <Text
          style={[
            styles.headerCount,
            { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm },
          ]}
        >
          {guides.length} {guides.length === 1 ? 'guide' : 'guides'}
        </Text>
      </View>

      {/* Network Status */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.colors.warning }]}>
          <Ionicons name="cloud-offline" size={16} color="#000" />
          <Text style={styles.offlineBannerText}>Offline - These guides are available</Text>
        </View>
      )}

      {/* Guide List */}
      <FlatList
        data={guides}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerCount: {
    fontWeight: '500',
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
  listContent: {
    paddingVertical: 8,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  guideInfo: {
    flex: 1,
  },
  guideTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  guideMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
