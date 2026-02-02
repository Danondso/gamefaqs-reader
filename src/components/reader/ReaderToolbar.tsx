/**
 * ReaderToolbar - Top toolbar with search, edit, bookmarks buttons
 *
 * Classic GameFAQs-style toolbar with simple text/icon buttons.
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export interface ReaderToolbarProps {
  onSearchPress: () => void;
  onEditPress: () => void;
  onBookmarksPress: () => void;
  onDownloadPress: () => void;
  isDownloaded: boolean;
  isDownloading: boolean;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  onSearchPress,
  onEditPress,
  onBookmarksPress,
  onDownloadPress,
  isDownloaded,
  isDownloading,
}) => {
  const { theme } = useTheme();

  const ToolbarButton = ({
    icon,
    label,
    onPress,
    disabled,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          borderColor: theme.colors.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={disabled ? theme.colors.textSecondary : theme.colors.link} />
      <Text
        style={[
          styles.buttonText,
          {
            color: disabled ? theme.colors.textSecondary : theme.colors.link,
            fontSize: theme.typography.fontSize.xs,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const downloadIcon = isDownloaded ? 'cloud-done' : isDownloading ? 'cloud-download' : 'cloud-download-outline';
  const downloadLabel = isDownloaded ? 'Saved' : isDownloading ? 'Saving...' : 'Download';

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
      <ToolbarButton icon="search" label="Search" onPress={onSearchPress} />
      <ToolbarButton icon="create" label="Edit" onPress={onEditPress} />
      <ToolbarButton icon="bookmarks" label="Bookmarks" onPress={onBookmarksPress} />
      <ToolbarButton
        icon={downloadIcon}
        label={downloadLabel}
        onPress={onDownloadPress}
        disabled={isDownloaded || isDownloading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
    minHeight: 44,
  },
  buttonText: {
    marginTop: 4,
  },
});
