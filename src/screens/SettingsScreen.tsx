import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  useColorScheme,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, validateServerUrl } from '../contexts/SettingsContext';
import { useNetworkStatus } from '../providers/NetworkProvider';
import { healthApi } from '../api/endpoints/health';
import { DownloadManager } from '../services/DownloadManager';
import { SyncManager } from '../services/SyncManager';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings, updateSettings } = useSettings();
  const { isOnline } = useNetworkStatus();

  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(settings.serverUrl);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState<number | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number | null>(null);

  // Load counts on mount
  React.useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [downloaded, pending] = await Promise.all([
        DownloadManager.getDownloadedCount(),
        SyncManager.getPendingCount(),
      ]);
      setDownloadedCount(downloaded);
      setPendingSyncCount(pending);
    } catch (error) {
      if (__DEV__) console.error('Failed to load counts:', error);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    try {
      await healthApi.getStatus();
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleServerUrlChange = (text: string) => {
    setServerUrlInput(text);
    // Clear validation error when user types
    if (urlValidationError) {
      setUrlValidationError(null);
    }
    // Reset connection status when URL changes
    setConnectionStatus('idle');
  };

  const handleSaveServerUrl = async () => {
    // Validate URL before saving
    const validation = validateServerUrl(serverUrlInput);
    if (!validation.valid) {
      setUrlValidationError(validation.error);
      return;
    }

    await updateSettings({ serverUrl: serverUrlInput });
    setShowServerModal(false);
    setUrlValidationError(null);
    Alert.alert('Success', 'Server URL updated');
  };

  const handleOpenServerModal = () => {
    setServerUrlInput(settings.serverUrl);
    setUrlValidationError(null);
    setConnectionStatus('idle');
    setShowServerModal(true);
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You need to be online to sync.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await SyncManager.syncAll();
      await loadCounts();
      if (result.failed > 0) {
        Alert.alert(
          'Sync Complete',
          `Synced ${result.success} items. ${result.failed} failed.`
        );
      } else {
        Alert.alert('Sync Complete', `Synced ${result.success} items.`);
      }
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to sync changes.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearDownloads = async () => {
    Alert.alert(
      'Clear Downloads',
      'Are you sure you want to remove all downloaded guides? This will clear your offline cache.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await DownloadManager.removeAllGuides();
              await loadCounts();
              Alert.alert('Success', 'All downloaded guides have been removed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear downloads.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#f5f5f5' },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000' }]}>
          Settings
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#8E8E93' : '#666' }]}>
          App settings and configuration
        </Text>

        {/* Network Status Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isOnline ? '#34C759' : '#FF9500',
            },
          ]}
        >
          <Ionicons
            name={isOnline ? 'cloud-done' : 'cloud-offline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.statusBannerText}>
            {isOnline ? 'Connected' : 'Offline Mode'}
          </Text>
        </View>

        {/* Server Configuration */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#666' }]}
          >
            Server Configuration
          </Text>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
            onPress={handleOpenServerModal}
          >
            <View style={styles.flex1}>
              <Text
                style={[styles.settingLabel, { color: isDark ? '#FFFFFF' : '#000' }]}
              >
                Server URL
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isDark ? '#8E8E93' : '#666' },
                ]}
                numberOfLines={1}
              >
                {settings.serverUrl}
              </Text>
            </View>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Offline & Sync */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#666' }]}
          >
            Offline & Sync
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
          >
            <View style={styles.flex1}>
              <Text
                style={[styles.settingLabel, { color: isDark ? '#FFFFFF' : '#000' }]}
              >
                Downloaded Guides
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isDark ? '#8E8E93' : '#666' },
                ]}
              >
                {downloadedCount !== null ? `${downloadedCount} guides available offline` : 'Loading...'}
              </Text>
            </View>
          </View>

          {pendingSyncCount !== null && pendingSyncCount > 0 && (
            <TouchableOpacity
              style={[
                styles.settingItem,
                styles.highlightItem,
                { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
              ]}
              onPress={handleSyncNow}
              disabled={isSyncing || !isOnline}
            >
              <View style={styles.flex1}>
                <Text style={[styles.settingLabel, styles.highlightText]}>
                  Sync Pending Changes
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: isDark ? '#8E8E93' : '#666' },
                  ]}
                >
                  {pendingSyncCount} changes waiting to sync
                </Text>
              </View>
              {isSyncing ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <Ionicons name="sync" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.settingItem,
              styles.dangerItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
            onPress={handleClearDownloads}
          >
            <View style={styles.flex1}>
              <Text style={[styles.settingLabel, styles.dangerText]}>
                Clear Downloaded Guides
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isDark ? '#8E8E93' : '#666' },
                ]}
              >
                Remove all offline guides
              </Text>
            </View>
            <Text style={[styles.settingChevron, styles.dangerText]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#666' }]}
          >
            Appearance
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: isDark ? '#FFFFFF' : '#000' },
                  ]}
                >
                  Use System Theme
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: isDark ? '#8E8E93' : '#666' },
                  ]}
                >
                  Follow device light/dark mode
                </Text>
              </View>
              <Switch
                value={settings.useSystemTheme}
                onValueChange={(value) => updateSettings({ useSystemTheme: value })}
                trackColor={{ false: '#767577', true: '#007AFF' }}
              />
            </View>
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text
                style={[styles.settingLabel, { color: isDark ? '#FFFFFF' : '#000' }]}
              >
                Default Font Size
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isDark ? '#8E8E93' : '#666' },
                ]}
              >
                {settings.defaultFontSize}pt (range: 10-24)
              </Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#666' }]}
          >
            About
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
          >
            <View>
              <Text
                style={[styles.settingLabel, { color: isDark ? '#FFFFFF' : '#000' }]}
              >
                Version
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isDark ? '#8E8E93' : '#666' },
                ]}
              >
                1.0.0 (API-first)
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
          >
            <View>
              <Text
                style={[styles.settingLabel, { color: isDark ? '#FFFFFF' : '#000' }]}
              >
                Made with
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isDark ? '#8E8E93' : '#666' },
                ]}
              >
                React Native, Expo & TanStack Query
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: isDark ? '#1C1C1E' : '#fff' },
            ]}
            onPress={() => {
              // TODO: Replace with your actual privacy policy URL
              const privacyPolicyUrl = 'https://example.com/privacy-policy';
              Linking.openURL(privacyPolicyUrl).catch((err) => {
                if (__DEV__) console.error('Failed to open privacy policy:', err);
                Alert.alert('Error', 'Could not open privacy policy');
              });
            }}
          >
            <View style={styles.flex1}>
              <Text
                style={[styles.settingLabel, { color: isDark ? '#FFFFFF' : '#000' }]}
              >
                Privacy Policy
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isDark ? '#8E8E93' : '#666' },
                ]}
              >
                View our privacy policy
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color={isDark ? '#8E8E93' : '#666'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Server URL Modal */}
      <Modal
        visible={showServerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowServerModal(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}
          edges={['top']}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowServerModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
              Server URL
            </Text>
            <TouchableOpacity onPress={handleSaveServerUrl}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#666' }]}>
              Server URL
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#f5f5f5',
                  color: isDark ? '#fff' : '#000',
                  borderColor: urlValidationError ? '#FF3B30' : 'transparent',
                  borderWidth: urlValidationError ? 1 : 0,
                },
              ]}
              value={serverUrlInput}
              onChangeText={handleServerUrlChange}
              placeholder="https://your-server.example.com"
              placeholderTextColor={isDark ? '#8E8E93' : '#999'}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={[styles.inputHint, { color: isDark ? '#8E8E93' : '#999' }]}>
              Enter the URL of your self-hosted GameFAQs Reader server
            </Text>

            {urlValidationError && (
              <View style={styles.statusMessage}>
                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                <Text style={[styles.statusText, { color: '#FF3B30' }]}>
                  {urlValidationError}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.testButton,
                {
                  backgroundColor: isTestingConnection ? '#ccc' : '#007AFF',
                },
              ]}
              onPress={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            {connectionStatus === 'success' && (
              <View style={styles.statusMessage}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={[styles.statusText, { color: '#34C759' }]}>
                  Connection successful
                </Text>
              </View>
            )}

            {connectionStatus === 'error' && (
              <View style={styles.statusMessage}>
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
                <Text style={[styles.statusText, { color: '#FF3B30' }]}>
                  Connection failed
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  statusBannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingChevron: {
    fontSize: 24,
    color: '#C7C7CC',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingInfo: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  highlightItem: {
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  highlightText: {
    color: '#007AFF',
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  dangerText: {
    color: '#FF3B30',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 16,
  },
  testButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
