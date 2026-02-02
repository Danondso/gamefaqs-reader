/**
 * BookmarkDialog - Create/edit bookmark modal
 *
 * Modal for creating new bookmarks at current scroll position.
 * Uses custom Dialog component with classic GameFAQs styling.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Dialog } from '../Dialog';
import { useTheme } from '../../contexts/ThemeContext';

export interface BookmarkDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, notes?: string) => void;
}

export const BookmarkDialog: React.FC<BookmarkDialogProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), notes.trim() || undefined);
      // Reset form
      setName('');
      setNotes('');
    }
  };

  const handleCancel = () => {
    // Reset form
    setName('');
    setNotes('');
    onClose();
  };

  const canSave = name.trim().length > 0;

  return (
    <Dialog
      visible={visible}
      title="Add Bookmark"
      message="Create a bookmark at the highlighted line"
      onDismiss={handleCancel}
      actions={
        canSave
          ? [
              {
                label: 'Cancel',
                onPress: handleCancel,
                variant: 'secondary' as const,
              },
              {
                label: 'Save',
                onPress: handleSave,
                variant: 'primary' as const,
              },
            ]
          : [
              {
                label: 'Cancel',
                onPress: handleCancel,
                variant: 'secondary' as const,
              },
            ]
      }
    >
      <View style={styles.form}>
        {/* Name Input */}
        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Enter bookmark name"
            placeholderTextColor={theme.colors.textSecondary}
            autoFocus
            returnKeyType="next"
            accessibilityLabel="Bookmark name"
            accessibilityHint="Enter a name for this bookmark"
          />
        </View>

        {/* Notes Input */}
        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            Notes (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this section..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="default"
            accessibilityLabel="Notes"
            accessibilityHint="Optionally add notes about this bookmark"
          />
        </View>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  form: {
    marginTop: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 8,
  },
});
