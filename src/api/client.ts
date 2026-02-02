import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_KEY = 'serverUrl';

const DEFAULT_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://your-server.example.com';

let cachedBaseUrl: string | null = null;

/**
 * Validates a server URL
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateServerUrl(url: string): { valid: true } | { valid: false; error: string } {
  const trimmed = url.trim();

  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // Check URL format
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Must be http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL must use http or https protocol' };
  }

  // In production, warn about HTTP (unless localhost)
  const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (!__DEV__ && parsed.protocol === 'http:' && !isLocalhost) {
    return { valid: false, error: 'Production URLs must use HTTPS for security' };
  }

  return { valid: true };
}

export async function getBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    cachedBaseUrl = stored || DEFAULT_URL;
  } catch {
    // SecureStore may fail on some platforms, fall back to default
    cachedBaseUrl = DEFAULT_URL;
  }
  return cachedBaseUrl;
}

export async function setBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  try {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, trimmed);
    cachedBaseUrl = trimmed;
  } catch (error) {
    if (__DEV__) console.error('Failed to save server URL to secure store:', error);
    throw error;
  }
}

export function clearUrlCache(): void {
  cachedBaseUrl = null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.code || 'UNKNOWN',
      error.error || 'An error occurred'
    );
  }

  return response.json();
}
