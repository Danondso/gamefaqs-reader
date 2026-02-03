import { DownloadManager, DownloadProgress } from '../services/DownloadManager';
import { guidesApi } from '@/api/endpoints/guides';
import { offlineCache } from '@/database/offlineCache';
import type { Guide } from '@/types';

// Mock dependencies
jest.mock('@/api/endpoints/guides');
jest.mock('@/database/offlineCache');

const mockGuidesApi = guidesApi as jest.Mocked<typeof guidesApi>;
const mockOfflineCache = offlineCache as jest.Mocked<typeof offlineCache>;

describe('DownloadManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockGuide = (id: string): Guide => ({
    id,
    title: `Guide ${id}`,
    content: `Content for ${id}`,
    format: 'txt',
    file_path: `/path/${id}.txt`,
    game_id: null,
    last_read_position: null,
    metadata: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  });

  describe('downloadGuide', () => {
    it('should download and save a guide', async () => {
      const mockGuide = createMockGuide('guide-1');
      mockGuidesApi.getById.mockResolvedValue({ data: mockGuide });
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      await DownloadManager.downloadGuide('guide-1');

      expect(mockGuidesApi.getById).toHaveBeenCalledWith('guide-1');
      expect(mockOfflineCache.saveGuide).toHaveBeenCalledWith(mockGuide);
    });

    it('should call progress callback with downloading status', async () => {
      const mockGuide = createMockGuide('guide-2');
      mockGuidesApi.getById.mockResolvedValue({ data: mockGuide });
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      const onProgress = jest.fn();

      await DownloadManager.downloadGuide('guide-2', onProgress);

      expect(onProgress).toHaveBeenCalledWith({
        guideId: 'guide-2',
        status: 'downloading',
      });
    });

    it('should call progress callback with complete status on success', async () => {
      const mockGuide = createMockGuide('guide-3');
      mockGuidesApi.getById.mockResolvedValue({ data: mockGuide });
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      const onProgress = jest.fn();

      await DownloadManager.downloadGuide('guide-3', onProgress);

      expect(onProgress).toHaveBeenCalledWith({
        guideId: 'guide-3',
        status: 'complete',
      });
    });

    it('should call progress callback with error status on failure', async () => {
      mockGuidesApi.getById.mockRejectedValue(new Error('Network error'));

      const onProgress = jest.fn();

      await expect(
        DownloadManager.downloadGuide('guide-4', onProgress)
      ).rejects.toThrow('Network error');

      expect(onProgress).toHaveBeenCalledWith({
        guideId: 'guide-4',
        status: 'error',
        error: 'Network error',
      });
    });

    it('should handle non-Error thrown objects', async () => {
      mockGuidesApi.getById.mockRejectedValue('String error');

      const onProgress = jest.fn();

      await expect(
        DownloadManager.downloadGuide('guide-5', onProgress)
      ).rejects.toBe('String error');

      expect(onProgress).toHaveBeenCalledWith({
        guideId: 'guide-5',
        status: 'error',
        error: 'Download failed',
      });
    });

    it('should work without progress callback', async () => {
      const mockGuide = createMockGuide('guide-6');
      mockGuidesApi.getById.mockResolvedValue({ data: mockGuide });
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      await expect(
        DownloadManager.downloadGuide('guide-6')
      ).resolves.not.toThrow();
    });
  });

  describe('downloadMultiple', () => {
    it('should download multiple guides', async () => {
      mockGuidesApi.getById.mockImplementation(async (id) => ({
        data: createMockGuide(id),
      }));
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      const result = await DownloadManager.downloadMultiple([
        'guide-a',
        'guide-b',
        'guide-c',
      ]);

      expect(result.success).toEqual(['guide-a', 'guide-b', 'guide-c']);
      expect(result.failed).toEqual([]);
    });

    it('should track failed downloads', async () => {
      mockGuidesApi.getById.mockImplementation(async (id) => {
        if (id === 'guide-fail') {
          throw new Error('Failed');
        }
        return { data: createMockGuide(id) };
      });
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      const result = await DownloadManager.downloadMultiple([
        'guide-ok',
        'guide-fail',
      ]);

      expect(result.success).toEqual(['guide-ok']);
      expect(result.failed).toEqual(['guide-fail']);
    });

    it('should call progress callback with completed count', async () => {
      mockGuidesApi.getById.mockImplementation(async (id) => ({
        data: createMockGuide(id),
      }));
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      const onProgress = jest.fn();

      await DownloadManager.downloadMultiple(
        ['guide-1', 'guide-2', 'guide-3'],
        onProgress
      );

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenCalledWith(1, 3);
      expect(onProgress).toHaveBeenCalledWith(2, 3);
      expect(onProgress).toHaveBeenCalledWith(3, 3);
    });

    it('should call progress even on failures', async () => {
      mockGuidesApi.getById.mockRejectedValue(new Error('All fail'));

      const onProgress = jest.fn();

      await DownloadManager.downloadMultiple(['guide-1', 'guide-2'], onProgress);

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });

    it('should return empty arrays for empty input', async () => {
      const result = await DownloadManager.downloadMultiple([]);

      expect(result.success).toEqual([]);
      expect(result.failed).toEqual([]);
    });

    it('should work without progress callback', async () => {
      mockGuidesApi.getById.mockImplementation(async (id) => ({
        data: createMockGuide(id),
      }));
      mockOfflineCache.saveGuide.mockResolvedValue(undefined);

      const result = await DownloadManager.downloadMultiple(['guide-1']);

      expect(result.success).toEqual(['guide-1']);
    });
  });

  describe('removeGuide', () => {
    it('should delete guide from cache', async () => {
      mockOfflineCache.deleteGuide.mockResolvedValue(undefined);

      await DownloadManager.removeGuide('guide-to-remove');

      expect(mockOfflineCache.deleteGuide).toHaveBeenCalledWith(
        'guide-to-remove'
      );
    });

    it('should propagate errors from cache', async () => {
      mockOfflineCache.deleteGuide.mockRejectedValue(new Error('DB error'));

      await expect(DownloadManager.removeGuide('guide-1')).rejects.toThrow(
        'DB error'
      );
    });
  });

  describe('removeAllGuides', () => {
    it('should delete all guides from cache', async () => {
      mockOfflineCache.deleteAllGuides.mockResolvedValue(undefined);

      await DownloadManager.removeAllGuides();

      expect(mockOfflineCache.deleteAllGuides).toHaveBeenCalled();
    });
  });

  describe('cache delegate methods', () => {
    it('getDownloadedGuides should delegate to offlineCache', async () => {
      const mockGuides = [
        { ...createMockGuide('guide-1'), downloaded_at: Date.now() },
      ];
      mockOfflineCache.getAllDownloadedGuides.mockResolvedValue(mockGuides);

      const result = await DownloadManager.getDownloadedGuides();

      expect(result).toEqual(mockGuides);
      expect(mockOfflineCache.getAllDownloadedGuides).toHaveBeenCalled();
    });

    it('getDownloadedIds should delegate to offlineCache', async () => {
      mockOfflineCache.getDownloadedGuideIds.mockResolvedValue(['id-1', 'id-2']);

      const result = await DownloadManager.getDownloadedIds();

      expect(result).toEqual(['id-1', 'id-2']);
      expect(mockOfflineCache.getDownloadedGuideIds).toHaveBeenCalled();
    });

    it('isDownloaded should delegate to offlineCache with correct ID', async () => {
      mockOfflineCache.isGuideDownloaded.mockResolvedValue(true);

      const result = await DownloadManager.isDownloaded('test-guide');

      expect(result).toBe(true);
      expect(mockOfflineCache.isGuideDownloaded).toHaveBeenCalledWith('test-guide');
    });

    it('getDownloadedCount should delegate to offlineCache', async () => {
      mockOfflineCache.getDownloadedCount.mockResolvedValue(42);

      const result = await DownloadManager.getDownloadedCount();

      expect(result).toBe(42);
      expect(mockOfflineCache.getDownloadedCount).toHaveBeenCalled();
    });
  });
});
