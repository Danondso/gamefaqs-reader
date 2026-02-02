import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch()
      .then(setNetworkState)
      .catch((error) => {
        if (__DEV__) console.error('Failed to fetch network state:', error);
      });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(setNetworkState);

    return () => {
      unsubscribe();
    };
  }, []);

  const value: NetworkContextType = {
    isOnline:
      networkState?.isConnected === true &&
      networkState?.isInternetReachable !== false,
    isConnected: networkState?.isConnected ?? null,
    connectionType: networkState?.type ?? null,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetworkStatus(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider');
  }
  return context;
}
