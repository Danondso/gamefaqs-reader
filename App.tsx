import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { offlineCache } from './src/database/offlineCache';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { QueryProvider } from './src/providers/QueryProvider';
import { NetworkProvider } from './src/providers/NetworkProvider';
import { LoadingState, ErrorState, ErrorBoundary } from './src/components';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeApp() {
      try {
        if (__DEV__) console.log('Starting app initialization...');
        // Initialize offline cache database
        await offlineCache.initialize();
        if (__DEV__) console.log('Offline cache initialized successfully');
        setIsReady(true);
      } catch (err: any) {
        if (__DEV__) console.error('Failed to initialize app:', err);
        setError(err.message || 'Failed to initialize app');
      }
    }

    initializeApp();
  }, []);

  if (error) {
    return (
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <ErrorState
            title="Initialization Error"
            message={error}
            onRetry={() => {
              setError(null);
              setIsReady(false);
              offlineCache
                .initialize()
                .then(() => setIsReady(true))
                .catch((err) => setError(err.message || 'Failed to initialize app'));
            }}
          />
        </View>
      </ThemeProvider>
    );
  }

  if (!isReady) {
    return (
      <ThemeProvider>
        <LoadingState message="Initializing..." />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryProvider>
          <NetworkProvider>
            <SettingsProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootNavigator />
                <StatusBar style="auto" />
              </GestureHandlerRootView>
            </SettingsProvider>
          </NetworkProvider>
        </QueryProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
