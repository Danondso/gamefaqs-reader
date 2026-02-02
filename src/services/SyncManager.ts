import { offlineCache } from '@/database/offlineCache';
import { guidesApi } from '@/api/endpoints/guides';
import { bookmarksApi } from '@/api/endpoints/bookmarks';
import { notesApi } from '@/api/endpoints/notes';

export interface SyncQueueItem {
  type: 'position' | 'bookmark' | 'note';
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
}

export interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}

export const SyncManager = {
  async queueChange(item: SyncQueueItem): Promise<void> {
    await offlineCache.addToSyncQueue(item.type, item.action, item.payload);
  },

  async getPendingCount(): Promise<number> {
    return offlineCache.getSyncQueueCount();
  },

  async syncAll(): Promise<SyncResult> {
    const queue = await offlineCache.getSyncQueue();
    const result: SyncResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        await offlineCache.removeSyncQueueItem(item.id);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return result;
  },

  async processQueueItem(item: {
    id: number;
    type: string;
    action: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const { type, action, payload } = item;

    switch (type) {
      case 'position':
        if (action === 'update') {
          await guidesApi.updatePosition(
            payload.guideId as string,
            payload.position as number
          );
        }
        break;

      case 'bookmark':
        if (action === 'create') {
          await bookmarksApi.create(payload.guideId as string, {
            position: payload.position as number,
            name: payload.name as string | undefined,
            page_reference: payload.page_reference as string | undefined,
            is_last_read: payload.is_last_read as boolean | undefined,
          });
        } else if (action === 'delete') {
          await bookmarksApi.delete(
            payload.guideId as string,
            payload.bookmarkId as string
          );
        }
        break;

      case 'note':
        if (action === 'create') {
          await notesApi.create(payload.guideId as string, {
            position: payload.position as number | undefined,
            content: payload.content as string,
          });
        } else if (action === 'update') {
          await notesApi.update(
            payload.guideId as string,
            payload.noteId as string,
            {
              position: payload.position as number | undefined,
              content: payload.content as string | undefined,
            }
          );
        } else if (action === 'delete') {
          await notesApi.delete(
            payload.guideId as string,
            payload.noteId as string
          );
        }
        break;

      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  },

  async clearQueue(): Promise<void> {
    await offlineCache.clearSyncQueue();
  },
};
