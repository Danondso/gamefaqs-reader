import { guidesApi } from '../api/endpoints/guides';
import { apiClient } from '../api/client';

// Mock the apiClient
jest.mock('../api/client', () => ({
  apiClient: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mock;

describe('guidesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call /guides with page and limit only when no filters', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20);

      expect(mockApiClient).toHaveBeenCalledWith('/guides?page=1&limit=20');
    });

    it('should call /guides with custom page and limit', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(3, 50);

      expect(mockApiClient).toHaveBeenCalledWith('/guides?page=3&limit=50');
    });

    it('should include platform filter in query string', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20, { platform: 'SNES' });

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides?page=1&limit=20&platform=SNES'
      );
    });

    it('should include tags filter in query string', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20, { tags: ['Walkthrough', 'FAQ'] });

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides?page=1&limit=20&tags=Walkthrough%2CFAQ'
      );
    });

    it('should include single tag filter in query string', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20, { tags: ['Walkthrough'] });

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides?page=1&limit=20&tags=Walkthrough'
      );
    });

    it('should include tagMatch filter in query string', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20, { tags: ['Walkthrough'], tagMatch: 'all' });

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides?page=1&limit=20&tags=Walkthrough&tagMatch=all'
      );
    });

    it('should include all filters combined in query string', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(2, 30, {
        platform: 'PlayStation',
        tags: ['Guide', 'Boss'],
        tagMatch: 'any',
      });

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides?page=2&limit=30&platform=PlayStation&tags=Guide%2CBoss&tagMatch=any'
      );
    });

    it('should not include empty tags array in query string', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20, { tags: [] });

      expect(mockApiClient).toHaveBeenCalledWith('/guides?page=1&limit=20');
    });

    it('should not include tagMatch without tags', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20, { tagMatch: 'all' });

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides?page=1&limit=20&tagMatch=all'
      );
    });

    it('should handle undefined filters', async () => {
      mockApiClient.mockResolvedValue({ data: [], pagination: {} });

      await guidesApi.getAll(1, 20, undefined);

      expect(mockApiClient).toHaveBeenCalledWith('/guides?page=1&limit=20');
    });
  });

  describe('getFilters', () => {
    it('should call /guides/filters endpoint', async () => {
      mockApiClient.mockResolvedValue({ platforms: [], tags: [] });

      await guidesApi.getFilters();

      expect(mockApiClient).toHaveBeenCalledWith('/guides/filters');
    });

    it('should return platforms and tags from response', async () => {
      const mockResponse = {
        platforms: ['SNES', 'PlayStation', 'Nintendo 64'],
        tags: ['Walkthrough', 'FAQ', 'Boss Guide'],
      };
      mockApiClient.mockResolvedValue(mockResponse);

      const result = await guidesApi.getFilters();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getById', () => {
    it('should call /guides/:id endpoint', async () => {
      mockApiClient.mockResolvedValue({ data: { id: 'abc123' } });

      await guidesApi.getById('abc123');

      expect(mockApiClient).toHaveBeenCalledWith('/guides/abc123');
    });
  });

  describe('search', () => {
    it('should call /guides/search with encoded query', async () => {
      mockApiClient.mockResolvedValue({ guides: [], content: [] });

      await guidesApi.search('final fantasy', 50);

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides/search?q=final%20fantasy&limit=50'
      );
    });

    it('should handle special characters in search query', async () => {
      mockApiClient.mockResolvedValue({ guides: [], content: [] });

      await guidesApi.search('boss guide & tips', 25);

      expect(mockApiClient).toHaveBeenCalledWith(
        '/guides/search?q=boss%20guide%20%26%20tips&limit=25'
      );
    });
  });

  describe('updatePosition', () => {
    it('should call PUT /guides/:id/position', async () => {
      mockApiClient.mockResolvedValue({ success: true });

      await guidesApi.updatePosition('guide123', 500);

      expect(mockApiClient).toHaveBeenCalledWith('/guides/guide123/position', {
        method: 'PUT',
        body: JSON.stringify({ position: 500 }),
      });
    });
  });
});
