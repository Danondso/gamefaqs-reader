/**
 * MetadataDialog - Edit guide metadata modal
 *
 * Modal for editing guide title, author, platform, and tags.
 * Uses custom Dialog component with classic GameFAQs styling.
 * Includes "Fix with AI" button to auto-fill metadata using Ollama.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dialog } from '../Dialog';
import { useTheme } from '../../contexts/ThemeContext';
import { aiApi } from '@/api/endpoints/ai';
import type { Guide } from '../../types';

export interface MetadataDialogProps {
  visible: boolean;
  guide: Guide | null;
  onClose: () => void;
  onSave: (updates: {
    title?: string;
    author?: string;
    platform?: string;
    tags?: string;
  }) => void;
  onAiSuccess?: (message: string) => void;
}

export const MetadataDialog: React.FC<MetadataDialogProps> = ({
  visible,
  guide,
  onClose,
  onSave,
  onAiSuccess,
}) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [platform, setPlatform] = useState('');
  const [tags, setTags] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Initialize form when guide changes
  useEffect(() => {
    if (guide) {
      setTitle(guide.title || '');

      try {
        const metadata = guide.metadata ? JSON.parse(guide.metadata) : {};
        setAuthor(metadata.author || '');
        setPlatform(metadata.platform || '');
        setTags(
          Array.isArray(metadata.tags) ? metadata.tags.join(', ') : ''
        );
      } catch (error) {
        if (__DEV__) console.error('Failed to parse guide metadata:', error);
        setAuthor('');
        setPlatform('');
        setTags('');
      }
    }
  }, [guide]);

  const handleSave = () => {
    onSave({
      title: title.trim() || undefined,
      author: author.trim() || undefined,
      platform: platform.trim() || undefined,
      tags: tags.trim() || undefined,
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    if (guide) {
      setTitle(guide.title || '');
      try {
        const metadata = guide.metadata ? JSON.parse(guide.metadata) : {};
        setAuthor(metadata.author || '');
        setPlatform(metadata.platform || '');
        setTags(
          Array.isArray(metadata.tags) ? metadata.tags.join(', ') : ''
        );
      } catch (error) {
        setAuthor('');
        setPlatform('');
        setTags('');
      }
    }
    setAiError(null);
    onClose();
  };

  const handleFixWithAI = async () => {
    if (!guide) return;

    setIsAnalyzing(true);
    setAiError(null);

    try {
      const response = await aiApi.analyzeGuide(guide.id, true);

      if (response.success && response.analysis) {
        const { gameName, platform: aiPlatform, author: aiAuthor, tags: aiTags } = response.analysis;

        // Track which fields were filled
        const filledFields: string[] = [];

        // Only update fields that AI found values for
        if (gameName) {
          setTitle(gameName);
          filledFields.push('title');
        }
        if (aiPlatform) {
          setPlatform(aiPlatform);
          filledFields.push('platform');
        }
        if (aiAuthor) {
          setAuthor(aiAuthor);
          filledFields.push('author');
        }
        if (aiTags && aiTags.length > 0) {
          setTags(aiTags.join(', '));
          filledFields.push('tags');
        }

        // Notify parent of success
        if (filledFields.length > 0) {
          onAiSuccess?.(`AI updated: ${filledFields.join(', ')}`);
        } else {
          onAiSuccess?.('AI analysis complete - no new data found');
        }
      }
    } catch (error) {
      if (__DEV__) console.error('AI analysis failed:', error);
      setAiError(
        error instanceof Error
          ? error.message
          : 'AI service unavailable. Make sure Ollama is running.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      title="Edit Guide Information"
      message="Update guide metadata and categorization"
      onDismiss={handleCancel}
      actions={[
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
      ]}
    >
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Fix with AI Button */}
        <TouchableOpacity
          style={[
            styles.aiButton,
            {
              backgroundColor: isAnalyzing
                ? theme.colors.border
                : theme.colors.primary,
            },
          ]}
          onPress={handleFixWithAI}
          disabled={isAnalyzing}
          accessibilityRole="button"
          accessibilityLabel="Fix with AI"
          accessibilityHint="Use AI to automatically detect guide metadata"
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.aiButtonText}>
            {isAnalyzing ? 'Analyzing...' : 'Fix with AI'}
          </Text>
        </TouchableOpacity>

        {/* AI Error Message */}
        {aiError && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: theme.colors.error + '20' },
            ]}
          >
            <Ionicons name="warning" size={16} color={theme.colors.error} />
            <Text
              style={[
                styles.errorText,
                {
                  color: theme.colors.error,
                  fontSize: theme.typography.fontSize.xs,
                },
              ]}
            >
              {aiError}
            </Text>
          </View>
        )}

        {/* Title Input */}
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
            Title
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
            value={title}
            onChangeText={setTitle}
            placeholder="Enter guide title"
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="next"
            accessibilityLabel="Guide title"
            accessibilityHint="Enter the guide title"
          />
        </View>

        {/* Author Input */}
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
            Author
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
            value={author}
            onChangeText={setAuthor}
            placeholder="Enter author name"
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="next"
            accessibilityLabel="Guide author"
            accessibilityHint="Enter the guide author name"
          />
        </View>

        {/* Platform Input */}
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
            Platform
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
            value={platform}
            onChangeText={setPlatform}
            placeholder="e.g., Nintendo 64, PlayStation"
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="next"
            accessibilityLabel="Platform"
            accessibilityHint="Enter the game platform"
          />
        </View>

        {/* Tags Input */}
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
            Tags
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
            value={tags}
            onChangeText={setTags}
            placeholder="walkthrough, faq, secrets (comma-separated)"
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="done"
            accessibilityLabel="Guide tags"
            accessibilityHint="Enter comma-separated tags"
          />
          <Text
            style={[
              styles.hint,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.xs,
              },
            ]}
          >
            Separate multiple tags with commas
          </Text>
        </View>
      </ScrollView>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  form: {
    marginTop: 16,
    maxHeight: 400,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
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
  hint: {
    marginTop: 4,
  },
});
