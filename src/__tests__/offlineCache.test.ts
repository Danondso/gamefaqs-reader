import { offlineCache } from '../database/offlineCache';
import type { Guide } from '@/types';

describe('offlineCache', () => {
  // Reset database before each test by reinitializing
  beforeEach(async () => {
    // The mock creates a new in-memory DB each time openDatabaseAsync is called
    // We need to clear any existing data
    await offlineCache.initialize();
    await offlineCache.deleteAllGuides();
    await offlineCache.clearSyncQueue();
  });

  const createTestGuide = (id: string, overrides?: Partial<Guide>): Guide => ({
    id,
    title: `Test Guide ${id}`,
    content: `Content for guide ${id}`,
    format: 'txt',
    file_path: `/path/to/guide-${id}.txt`,
    game_id: null,
    last_read_position: null,
    metadata: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    ...overrides,
  });

  describe('initialize', () => {
    it('should initialize without error', async () => {
      await expect(offlineCache.initialize()).resolves.not.toThrow();
    });

    it('should be idempotent (safe to call multiple times)', async () => {
      await offlineCache.initialize();
      await offlineCache.initialize();
      await expect(offlineCache.initialize()).resolves.not.toThrow();
    });
  });

  describe('saveGuide and getGuide', () => {
    it('should save and retrieve a guide', async () => {
      const guide = createTestGuide('guide-1');

      await offlineCache.saveGuide(guide);
      const retrieved = await offlineCache.getGuide('guide-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('guide-1');
      expect(retrieved?.title).toBe('Test Guide guide-1');
      expect(retrieved?.content).toBe('Content for guide guide-1');
    });

    it('should return null for non-existent guide', async () => {
      const retrieved = await offlineCache.getGuide('non-existent');

      expect(retrieved).toBeNull();
    });

    it('should save guide with all fields', async () => {
      const guide = createTestGuide('full-guide', {
        game_id: 'game-123',
        last_read_position: 500,
        metadata: JSON.stringify({ platform: 'SNES', tags: ['FAQ'] }),
      });

      await offlineCache.saveGuide(guide);
      const retrieved = await offlineCache.getGuide('full-guide');

      expect(retrieved?.game_id).toBe('game-123');
      expect(retrieved?.last_read_position).toBe(500);
      expect(retrieved?.metadata).toBe(
        JSON.stringify({ platform: 'SNES', tags: ['FAQ'] })
      );
    });

    it('should update existing guide on save (upsert)', async () => {
      const guide = createTestGuide('update-test', { title: 'Original Title' });
      await offlineCache.saveGuide(guide);

      const updatedGuide = createTestGuide('update-test', {
        title: 'Updated Title',
      });
      await offlineCache.saveGuide(updatedGuide);

      const retrieved = await offlineCache.getGuide('update-test');
      expect(retrieved?.title).toBe('Updated Title');
    });

    it('should handle different guide formats', async () => {
      const formats: Array<Guide['format']> = ['txt', 'html', 'md', 'pdf'];

      for (const format of formats) {
        const guide = createTestGuide(`guide-${format}`, { format });
        await offlineCache.saveGuide(guide);

        const retrieved = await offlineCache.getGuide(`guide-${format}`);
        expect(retrieved?.format).toBe(format);
      }
    });
  });

  describe('getAllDownloadedGuides', () => {
    it('should return empty array when no guides', async () => {
      const guides = await offlineCache.getAllDownloadedGuides();

      expect(guides).toEqual([]);
    });

    it('should return all saved guides', async () => {
      await offlineCache.saveGuide(createTestGuide('guide-a'));
      await offlineCache.saveGuide(createTestGuide('guide-b'));
      await offlineCache.saveGuide(createTestGuide('guide-c'));

      const guides = await offlineCache.getAllDownloadedGuides();

      expect(guides).toHaveLength(3);
    });

    it('should order by downloaded_at DESC', async () => {
      // Save guides with slight delays to ensure different timestamps
      const guideA = createTestGuide('guide-a');
      await offlineCache.saveGuide(guideA);

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const guideB = createTestGuide('guide-b');
      await offlineCache.saveGuide(guideB);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const guideC = createTestGuide('guide-c');
      await offlineCache.saveGuide(guideC);

      const guides = await offlineCache.getAllDownloadedGuides();

      // Most recent should be first
      expect(guides[0].id).toBe('guide-c');
      expect(guides[2].id).toBe('guide-a');
    });

    it('should include downloaded_at timestamp', async () => {
      const guide = createTestGuide('guide-with-timestamp');
      await offlineCache.saveGuide(guide);

      const guides = await offlineCache.getAllDownloadedGuides();

      expect(guides[0].downloaded_at).toBeDefined();
      expect(typeof guides[0].downloaded_at).toBe('number');
    });
  });

  describe('getDownloadedGuideIds', () => {
    it('should return empty array when no guides', async () => {
      const ids = await offlineCache.getDownloadedGuideIds();

      expect(ids).toEqual([]);
    });

    it('should return all guide IDs', async () => {
      await offlineCache.saveGuide(createTestGuide('id-1'));
      await offlineCache.saveGuide(createTestGuide('id-2'));
      await offlineCache.saveGuide(createTestGuide('id-3'));

      const ids = await offlineCache.getDownloadedGuideIds();

      expect(ids).toHaveLength(3);
      expect(ids).toContain('id-1');
      expect(ids).toContain('id-2');
      expect(ids).toContain('id-3');
    });
  });

  describe('deleteGuide', () => {
    it('should delete a specific guide', async () => {
      await offlineCache.saveGuide(createTestGuide('to-delete'));
      await offlineCache.saveGuide(createTestGuide('to-keep'));

      await offlineCache.deleteGuide('to-delete');

      const deleted = await offlineCache.getGuide('to-delete');
      const kept = await offlineCache.getGuide('to-keep');

      expect(deleted).toBeNull();
      expect(kept).not.toBeNull();
    });

    it('should not error when deleting non-existent guide', async () => {
      await expect(
        offlineCache.deleteGuide('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('deleteAllGuides', () => {
    it('should delete all guides', async () => {
      await offlineCache.saveGuide(createTestGuide('guide-1'));
      await offlineCache.saveGuide(createTestGuide('guide-2'));
      await offlineCache.saveGuide(createTestGuide('guide-3'));

      await offlineCache.deleteAllGuides();

      const guides = await offlineCache.getAllDownloadedGuides();
      expect(guides).toHaveLength(0);
    });

    it('should not error when no guides exist', async () => {
      await expect(offlineCache.deleteAllGuides()).resolves.not.toThrow();
    });
  });

  describe('isGuideDownloaded', () => {
    it('should return true for downloaded guide', async () => {
      await offlineCache.saveGuide(createTestGuide('downloaded'));

      const isDownloaded = await offlineCache.isGuideDownloaded('downloaded');

      expect(isDownloaded).toBe(true);
    });

    it('should return false for non-existent guide', async () => {
      const isDownloaded = await offlineCache.isGuideDownloaded('not-downloaded');

      expect(isDownloaded).toBe(false);
    });

    it('should return false after guide is deleted', async () => {
      await offlineCache.saveGuide(createTestGuide('was-downloaded'));
      await offlineCache.deleteGuide('was-downloaded');

      const isDownloaded = await offlineCache.isGuideDownloaded('was-downloaded');

      expect(isDownloaded).toBe(false);
    });
  });

  describe('getDownloadedCount', () => {
    it('should return 0 when no guides', async () => {
      const count = await offlineCache.getDownloadedCount();

      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      await offlineCache.saveGuide(createTestGuide('guide-1'));
      await offlineCache.saveGuide(createTestGuide('guide-2'));

      const count = await offlineCache.getDownloadedCount();

      expect(count).toBe(2);
    });

    it('should update after deletions', async () => {
      await offlineCache.saveGuide(createTestGuide('guide-1'));
      await offlineCache.saveGuide(createTestGuide('guide-2'));

      await offlineCache.deleteGuide('guide-1');

      const count = await offlineCache.getDownloadedCount();

      expect(count).toBe(1);
    });
  });

  describe('sync queue operations', () => {
    describe('addToSyncQueue', () => {
      it('should add item to sync queue', async () => {
        await offlineCache.addToSyncQueue('position', 'update', {
          guideId: 'guide-1',
          position: 100,
        });

        const queue = await offlineCache.getSyncQueue();

        expect(queue).toHaveLength(1);
        expect(queue[0].type).toBe('position');
        expect(queue[0].action).toBe('update');
        expect(queue[0].payload).toEqual({ guideId: 'guide-1', position: 100 });
      });

      it('should add multiple items', async () => {
        await offlineCache.addToSyncQueue('position', 'update', {
          guideId: 'g1',
        });
        await offlineCache.addToSyncQueue('bookmark', 'create', {
          guideId: 'g2',
        });
        await offlineCache.addToSyncQueue('note', 'delete', { guideId: 'g3' });

        const queue = await offlineCache.getSyncQueue();

        expect(queue).toHaveLength(3);
      });
    });

    describe('getSyncQueue', () => {
      it('should return empty array when queue is empty', async () => {
        const queue = await offlineCache.getSyncQueue();

        expect(queue).toEqual([]);
      });

      it('should return items ordered by created_at ASC', async () => {
        await offlineCache.addToSyncQueue('position', 'update', { order: 1 });
        await new Promise((resolve) => setTimeout(resolve, 10));
        await offlineCache.addToSyncQueue('bookmark', 'create', { order: 2 });
        await new Promise((resolve) => setTimeout(resolve, 10));
        await offlineCache.addToSyncQueue('note', 'update', { order: 3 });

        const queue = await offlineCache.getSyncQueue();

        expect(queue[0].payload.order).toBe(1);
        expect(queue[1].payload.order).toBe(2);
        expect(queue[2].payload.order).toBe(3);
      });

      it('should parse JSON payload', async () => {
        await offlineCache.addToSyncQueue('note', 'create', {
          guideId: 'guide-1',
          content: 'Test note content',
          position: 500,
        });

        const queue = await offlineCache.getSyncQueue();

        expect(queue[0].payload.guideId).toBe('guide-1');
        expect(queue[0].payload.content).toBe('Test note content');
        expect(queue[0].payload.position).toBe(500);
      });

      it('should include created_at timestamp', async () => {
        const beforeAdd = Date.now();
        await offlineCache.addToSyncQueue('position', 'update', {});
        const afterAdd = Date.now();

        const queue = await offlineCache.getSyncQueue();

        expect(queue[0].created_at).toBeGreaterThanOrEqual(beforeAdd);
        expect(queue[0].created_at).toBeLessThanOrEqual(afterAdd);
      });
    });

    describe('removeSyncQueueItem', () => {
      it('should remove specific item from queue', async () => {
        await offlineCache.addToSyncQueue('position', 'update', { id: 'a' });
        await offlineCache.addToSyncQueue('bookmark', 'create', { id: 'b' });

        const queueBefore = await offlineCache.getSyncQueue();
        const itemToRemove = queueBefore[0];

        await offlineCache.removeSyncQueueItem(itemToRemove.id);

        const queueAfter = await offlineCache.getSyncQueue();

        expect(queueAfter).toHaveLength(1);
        expect(queueAfter[0].payload.id).toBe('b');
      });

      it('should not error when removing non-existent item', async () => {
        await expect(
          offlineCache.removeSyncQueueItem(99999)
        ).resolves.not.toThrow();
      });
    });

    describe('clearSyncQueue', () => {
      it('should remove all items from queue', async () => {
        await offlineCache.addToSyncQueue('position', 'update', {});
        await offlineCache.addToSyncQueue('bookmark', 'create', {});
        await offlineCache.addToSyncQueue('note', 'delete', {});

        await offlineCache.clearSyncQueue();

        const queue = await offlineCache.getSyncQueue();

        expect(queue).toHaveLength(0);
      });

      it('should not error when queue is already empty', async () => {
        await expect(offlineCache.clearSyncQueue()).resolves.not.toThrow();
      });
    });

    describe('getSyncQueueCount', () => {
      it('should return 0 for empty queue', async () => {
        const count = await offlineCache.getSyncQueueCount();

        expect(count).toBe(0);
      });

      it('should return correct count', async () => {
        await offlineCache.addToSyncQueue('position', 'update', {});
        await offlineCache.addToSyncQueue('bookmark', 'create', {});

        const count = await offlineCache.getSyncQueueCount();

        expect(count).toBe(2);
      });

      it('should update after removal', async () => {
        await offlineCache.addToSyncQueue('position', 'update', {});
        await offlineCache.addToSyncQueue('bookmark', 'create', {});

        const queue = await offlineCache.getSyncQueue();
        await offlineCache.removeSyncQueueItem(queue[0].id);

        const count = await offlineCache.getSyncQueueCount();

        expect(count).toBe(1);
      });

      it('should return 0 after clear', async () => {
        await offlineCache.addToSyncQueue('position', 'update', {});
        await offlineCache.clearSyncQueue();

        const count = await offlineCache.getSyncQueueCount();

        expect(count).toBe(0);
      });
    });
  });
});
