import { guidesApi } from '@/api/endpoints/guides';
import { offlineCache } from '@/database/offlineCache';
import type { Guide } from '@/types';

export interface DownloadProgress {
  guideId: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  error?: string;
}

type DownloadProgressCallback = (progress: DownloadProgress) => void;

export const DownloadManager = {
  async downloadGuide(
    guideId: string,
    onProgress?: DownloadProgressCallback
  ): Promise<void> {
    onProgress?.({
      guideId,
      status: 'downloading',
    });

    try {
      const response = await guidesApi.getById(guideId);
      await offlineCache.saveGuide(response.data);

      onProgress?.({
        guideId,
        status: 'complete',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Download failed';
      onProgress?.({
        guideId,
        status: 'error',
        error: errorMessage,
      });
      throw error;
    }
  },

  async downloadMultiple(
    guideIds: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (let i = 0; i < guideIds.length; i++) {
      const guideId = guideIds[i];
      try {
        await this.downloadGuide(guideId);
        success.push(guideId);
      } catch {
        failed.push(guideId);
      }
      onProgress?.(i + 1, guideIds.length);
    }

    return { success, failed };
  },

  async removeGuide(guideId: string): Promise<void> {
    await offlineCache.deleteGuide(guideId);
  },

  async removeAllGuides(): Promise<void> {
    await offlineCache.deleteAllGuides();
  },

  async getDownloadedGuides(): Promise<Array<Guide & { downloaded_at: number }>> {
    return offlineCache.getAllDownloadedGuides();
  },

  async getDownloadedIds(): Promise<string[]> {
    return offlineCache.getDownloadedGuideIds();
  },

  async isDownloaded(guideId: string): Promise<boolean> {
    return offlineCache.isGuideDownloaded(guideId);
  },

  async getDownloadedCount(): Promise<number> {
    return offlineCache.getDownloadedCount();
  },
};
