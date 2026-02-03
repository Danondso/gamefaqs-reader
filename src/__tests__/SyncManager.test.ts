import { SyncManager, SyncQueueItem } from '../services/SyncManager';
import { offlineCache } from '@/database/offlineCache';
import { guidesApi } from '@/api/endpoints/guides';
import { bookmarksApi } from '@/api/endpoints/bookmarks';
import { notesApi } from '@/api/endpoints/notes';

// Mock dependencies
jest.mock('@/database/offlineCache');
jest.mock('@/api/endpoints/guides');
jest.mock('@/api/endpoints/bookmarks');
jest.mock('@/api/endpoints/notes');

const mockOfflineCache = offlineCache as jest.Mocked<typeof offlineCache>;
const mockGuidesApi = guidesApi as jest.Mocked<typeof guidesApi>;
const mockBookmarksApi = bookmarksApi as jest.Mocked<typeof bookmarksApi>;
const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;

describe('SyncManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queueChange', () => {
    const queueTestCases: Array<{ type: SyncQueueItem['type']; action: SyncQueueItem['action']; payload: Record<string, unknown> }> = [
      { type: 'position', action: 'update', payload: { guideId: 'guide-1', position: 500 } },
      { type: 'bookmark', action: 'create', payload: { guideId: 'guide-1', position: 100, name: 'Chapter 1' } },
      { type: 'note', action: 'create', payload: { guideId: 'guide-1', content: 'My note', position: 200 } },
    ];

    it.each(queueTestCases)(
      'should add $type $action to queue',
      async ({ type, action, payload }) => {
        mockOfflineCache.addToSyncQueue.mockResolvedValue(undefined);

        await SyncManager.queueChange({ type, action, payload });

        expect(mockOfflineCache.addToSyncQueue).toHaveBeenCalledWith(type, action, payload);
      }
    );
  });

  describe('getPendingCount', () => {
    it('should return count from offline cache', async () => {
      mockOfflineCache.getSyncQueueCount.mockResolvedValue(5);

      const count = await SyncManager.getPendingCount();

      expect(count).toBe(5);
      expect(mockOfflineCache.getSyncQueueCount).toHaveBeenCalled();
    });
  });

  describe('syncAll', () => {
    it('should process all items in queue', async () => {
      mockOfflineCache.getSyncQueue.mockResolvedValue([
        {
          id: 1,
          type: 'position',
          action: 'update',
          payload: { guideId: 'g1', position: 100 },
          created_at: Date.now(),
        },
        {
          id: 2,
          type: 'position',
          action: 'update',
          payload: { guideId: 'g2', position: 200 },
          created_at: Date.now(),
        },
      ]);
      mockGuidesApi.updatePosition.mockResolvedValue({ success: true });
      mockOfflineCache.removeSyncQueueItem.mockResolvedValue(undefined);

      const result = await SyncManager.syncAll();

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should track failures', async () => {
      mockOfflineCache.getSyncQueue.mockResolvedValue([
        {
          id: 1,
          type: 'position',
          action: 'update',
          payload: { guideId: 'g1', position: 100 },
          created_at: Date.now(),
        },
        {
          id: 2,
          type: 'position',
          action: 'update',
          payload: { guideId: 'g2', position: 200 },
          created_at: Date.now(),
        },
      ]);
      mockGuidesApi.updatePosition
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('API error'));
      mockOfflineCache.removeSyncQueueItem.mockResolvedValue(undefined);

      const result = await SyncManager.syncAll();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toContain('API error');
    });

    it('should remove successful items from queue', async () => {
      mockOfflineCache.getSyncQueue.mockResolvedValue([
        {
          id: 42,
          type: 'position',
          action: 'update',
          payload: { guideId: 'g1', position: 100 },
          created_at: Date.now(),
        },
      ]);
      mockGuidesApi.updatePosition.mockResolvedValue({ success: true });
      mockOfflineCache.removeSyncQueueItem.mockResolvedValue(undefined);

      await SyncManager.syncAll();

      expect(mockOfflineCache.removeSyncQueueItem).toHaveBeenCalledWith(42);
    });

    it('should not remove failed items from queue', async () => {
      mockOfflineCache.getSyncQueue.mockResolvedValue([
        {
          id: 99,
          type: 'position',
          action: 'update',
          payload: { guideId: 'g1', position: 100 },
          created_at: Date.now(),
        },
      ]);
      mockGuidesApi.updatePosition.mockRejectedValue(new Error('Failed'));

      await SyncManager.syncAll();

      expect(mockOfflineCache.removeSyncQueueItem).not.toHaveBeenCalled();
    });

    it('should handle empty queue', async () => {
      mockOfflineCache.getSyncQueue.mockResolvedValue([]);

      const result = await SyncManager.syncAll();

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle non-Error thrown objects', async () => {
      mockOfflineCache.getSyncQueue.mockResolvedValue([
        {
          id: 1,
          type: 'position',
          action: 'update',
          payload: { guideId: 'g1', position: 100 },
          created_at: Date.now(),
        },
      ]);
      mockGuidesApi.updatePosition.mockRejectedValue('String error');

      const result = await SyncManager.syncAll();

      expect(result.failed).toBe(1);
      expect(result.errors).toContain('Unknown error');
    });
  });

  describe('processQueueItem', () => {
    describe('position type', () => {
      it('should update position via API', async () => {
        mockGuidesApi.updatePosition.mockResolvedValue({ success: true });

        await SyncManager.processQueueItem({
          id: 1,
          type: 'position',
          action: 'update',
          payload: { guideId: 'guide-123', position: 500 },
        });

        expect(mockGuidesApi.updatePosition).toHaveBeenCalledWith(
          'guide-123',
          500
        );
      });
    });

    describe('bookmark type', () => {
      it('should create bookmark via API', async () => {
        mockBookmarksApi.create.mockResolvedValue({
          data: {
            id: 'bookmark-1',
            guide_id: 'guide-1',
            position: 100,
            name: 'Chapter 1',
            page_reference: null,
            is_last_read: false,
            created_at: Date.now(),
          },
        });

        await SyncManager.processQueueItem({
          id: 1,
          type: 'bookmark',
          action: 'create',
          payload: {
            guideId: 'guide-1',
            position: 100,
            name: 'Chapter 1',
            page_reference: 'Page 10',
            is_last_read: false,
          },
        });

        expect(mockBookmarksApi.create).toHaveBeenCalledWith('guide-1', {
          position: 100,
          name: 'Chapter 1',
          page_reference: 'Page 10',
          is_last_read: false,
        });
      });

      it('should delete bookmark via API', async () => {
        mockBookmarksApi.delete.mockResolvedValue({ success: true });

        await SyncManager.processQueueItem({
          id: 1,
          type: 'bookmark',
          action: 'delete',
          payload: {
            guideId: 'guide-1',
            bookmarkId: 'bookmark-99',
          },
        });

        expect(mockBookmarksApi.delete).toHaveBeenCalledWith(
          'guide-1',
          'bookmark-99'
        );
      });
    });

    describe('note type', () => {
      it('should create note via API', async () => {
        mockNotesApi.create.mockResolvedValue({
          data: {
            id: 'note-1',
            guide_id: 'guide-1',
            position: 200,
            content: 'My note',
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        });

        await SyncManager.processQueueItem({
          id: 1,
          type: 'note',
          action: 'create',
          payload: {
            guideId: 'guide-1',
            position: 200,
            content: 'My note',
          },
        });

        expect(mockNotesApi.create).toHaveBeenCalledWith('guide-1', {
          position: 200,
          content: 'My note',
        });
      });

      it('should update note via API', async () => {
        mockNotesApi.update.mockResolvedValue({
          data: {
            id: 'note-1',
            guide_id: 'guide-1',
            position: 250,
            content: 'Updated note',
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        });

        await SyncManager.processQueueItem({
          id: 1,
          type: 'note',
          action: 'update',
          payload: {
            guideId: 'guide-1',
            noteId: 'note-1',
            position: 250,
            content: 'Updated note',
          },
        });

        expect(mockNotesApi.update).toHaveBeenCalledWith('guide-1', 'note-1', {
          position: 250,
          content: 'Updated note',
        });
      });

      it('should delete note via API', async () => {
        mockNotesApi.delete.mockResolvedValue({ success: true });

        await SyncManager.processQueueItem({
          id: 1,
          type: 'note',
          action: 'delete',
          payload: {
            guideId: 'guide-1',
            noteId: 'note-99',
          },
        });

        expect(mockNotesApi.delete).toHaveBeenCalledWith('guide-1', 'note-99');
      });
    });

    describe('unknown type', () => {
      it('should throw error for unknown sync type', async () => {
        await expect(
          SyncManager.processQueueItem({
            id: 1,
            type: 'unknown-type',
            action: 'create',
            payload: {},
          })
        ).rejects.toThrow('Unknown sync type: unknown-type');
      });
    });
  });

  describe('clearQueue', () => {
    it('should clear the sync queue', async () => {
      mockOfflineCache.clearSyncQueue.mockResolvedValue(undefined);

      await SyncManager.clearQueue();

      expect(mockOfflineCache.clearSyncQueue).toHaveBeenCalled();
    });
  });
});
