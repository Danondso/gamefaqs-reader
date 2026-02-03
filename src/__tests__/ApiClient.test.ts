import * as SecureStore from 'expo-secure-store';
import {
  validateServerUrl,
  getBaseUrl,
  setBaseUrl,
  clearUrlCache,
  apiClient,
  ApiError,
} from '../api/client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Get typed mocks
const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearUrlCache();
    mockFetch.mockReset();
  });

  describe('validateServerUrl', () => {
    it('should accept valid https URL', () => {
      const result = validateServerUrl('https://api.example.com');
      expect(result).toEqual({ valid: true });
    });

    it('should accept valid http URL', () => {
      const result = validateServerUrl('http://localhost:3000');
      expect(result).toEqual({ valid: true });
    });

    it('should accept URL with port', () => {
      const result = validateServerUrl('https://api.example.com:8080');
      expect(result).toEqual({ valid: true });
    });

    it('should accept URL with path', () => {
      const result = validateServerUrl('https://api.example.com/v1');
      expect(result).toEqual({ valid: true });
    });

    it('should reject empty string', () => {
      const result = validateServerUrl('');
      expect(result).toEqual({ valid: false, error: 'URL cannot be empty' });
    });

    it('should reject whitespace-only string', () => {
      const result = validateServerUrl('   ');
      expect(result).toEqual({ valid: false, error: 'URL cannot be empty' });
    });

    it('should reject invalid URL format', () => {
      const result = validateServerUrl('not-a-url');
      expect(result).toEqual({ valid: false, error: 'Invalid URL format' });
    });

    it('should reject URL without protocol', () => {
      const result = validateServerUrl('example.com');
      expect(result).toEqual({ valid: false, error: 'Invalid URL format' });
    });

    it('should reject ftp protocol', () => {
      const result = validateServerUrl('ftp://files.example.com');
      expect(result).toEqual({
        valid: false,
        error: 'URL must use http or https protocol',
      });
    });

    it('should reject file protocol', () => {
      const result = validateServerUrl('file:///path/to/file');
      expect(result).toEqual({
        valid: false,
        error: 'URL must use http or https protocol',
      });
    });

    it('should reject javascript protocol', () => {
      const result = validateServerUrl('javascript:alert(1)');
      expect(result).toEqual({
        valid: false,
        error: 'URL must use http or https protocol',
      });
    });

    it('should trim whitespace from URL', () => {
      const result = validateServerUrl('  https://api.example.com  ');
      expect(result).toEqual({ valid: true });
    });
  });

  describe('getBaseUrl', () => {
    it('should return stored URL from SecureStore', async () => {
      mockGetItemAsync.mockResolvedValue('https://custom.server.com');

      const url = await getBaseUrl();

      expect(url).toBe('https://custom.server.com');
      expect(mockGetItemAsync).toHaveBeenCalledWith('serverUrl');
    });

    it('should return default URL when nothing stored', async () => {
      mockGetItemAsync.mockResolvedValue(null);

      const url = await getBaseUrl();

      // In dev mode, default is http://localhost:3000
      expect(url).toBeTruthy();
    });

    it('should cache the URL after first retrieval', async () => {
      mockGetItemAsync.mockResolvedValue('https://cached.server.com');

      await getBaseUrl();
      await getBaseUrl();
      await getBaseUrl();

      // Should only call SecureStore once
      expect(mockGetItemAsync).toHaveBeenCalledTimes(1);
    });

    it('should return cached URL on subsequent calls', async () => {
      mockGetItemAsync.mockResolvedValue('https://first.server.com');

      const first = await getBaseUrl();

      // Change what would be returned (but cache should prevent new call)
      mockGetItemAsync.mockResolvedValue('https://second.server.com');

      const second = await getBaseUrl();

      expect(first).toBe(second);
      expect(second).toBe('https://first.server.com');
    });

    it('should fall back to default when SecureStore fails', async () => {
      mockGetItemAsync.mockRejectedValue(new Error('SecureStore error'));

      const url = await getBaseUrl();

      // Should return some default URL
      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    });
  });

  describe('setBaseUrl', () => {
    it('should store URL in SecureStore', async () => {
      mockSetItemAsync.mockResolvedValue(undefined);

      await setBaseUrl('https://new.server.com');

      expect(mockSetItemAsync).toHaveBeenCalledWith(
        'serverUrl',
        'https://new.server.com'
      );
    });

    it('should trim whitespace from URL', async () => {
      mockSetItemAsync.mockResolvedValue(undefined);

      await setBaseUrl('  https://trimmed.server.com  ');

      expect(mockSetItemAsync).toHaveBeenCalledWith(
        'serverUrl',
        'https://trimmed.server.com'
      );
    });

    it('should update cache after setting', async () => {
      mockSetItemAsync.mockResolvedValue(undefined);

      await setBaseUrl('https://updated.server.com');

      // Cache should be updated, so getBaseUrl should return new value
      const url = await getBaseUrl();
      expect(url).toBe('https://updated.server.com');
    });

    it('should throw when SecureStore fails', async () => {
      mockSetItemAsync.mockRejectedValue(new Error('Storage full'));

      await expect(setBaseUrl('https://failing.server.com')).rejects.toThrow(
        'Storage full'
      );
    });
  });

  describe('clearUrlCache', () => {
    it('should clear the cached URL', async () => {
      mockGetItemAsync.mockResolvedValue('https://cached.server.com');

      // Prime the cache
      await getBaseUrl();

      // Clear it
      clearUrlCache();

      // Change what SecureStore returns
      mockGetItemAsync.mockResolvedValue('https://new.server.com');

      // Should fetch fresh from SecureStore
      const url = await getBaseUrl();
      expect(url).toBe('https://new.server.com');
      expect(mockGetItemAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('apiClient', () => {
    beforeEach(() => {
      mockGetItemAsync.mockResolvedValue('https://api.test.com');
    });

    it('should make GET request to correct URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      await apiClient('/guides');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/guides',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should return parsed JSON response', async () => {
      const responseData = { data: [{ id: '1', title: 'Guide 1' }] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient<{ data: Array<{ id: string; title: string }> }>('/guides');

      expect(result).toEqual(responseData);
    });

    it('should pass request options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient('/guides/1', {
        method: 'PUT',
        body: JSON.stringify({ position: 100 }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/guides/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ position: 100 }),
        })
      );
    });

    it('should merge custom headers with defaults', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient('/guides', {
        headers: {
          Authorization: 'Bearer token123',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          },
        })
      );
    });

    it('should throw ApiError with status, code, and message on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({ code: 'NOT_FOUND', error: 'Guide not found' }),
      });

      try {
        await apiClient('/guides/999');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe('NOT_FOUND');
        expect(apiError.message).toBe('Guide not found');
      }
    });

    it('should handle non-JSON error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('Not JSON')),
      });

      try {
        await apiClient('/guides');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('UNKNOWN');
        expect((error as ApiError).message).toBe('An error occurred');
      }
    });

    it('should propagate fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiClient('/guides')).rejects.toThrow('Network error');
    });
  });

  describe('ApiError', () => {
    it('should construct correctly and extend Error', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Resource not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });
  });
});
