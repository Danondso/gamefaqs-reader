import { apiClient } from '../client';

export interface AIAnalysisResult {
  gameName?: string;
  platform?: string;
  author?: string;
  tags?: string[];
  summary?: string;
}

export interface AIAnalyzeResponse {
  success: boolean;
  guideId: string;
  analysis: AIAnalysisResult;
  existing?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AIStatusResponse {
  available: boolean;
  host: string;
  models?: Array<{ name: string; size: number }>;
  error?: string;
}

export const aiApi = {
  getStatus: () => apiClient<AIStatusResponse>('/ai/status'),

  analyzeGuide: (guideId: string, preview = true) =>
    apiClient<AIAnalyzeResponse>(`/ai/analyze/${guideId}?preview=${preview}`, {
      method: 'POST',
    }),

  saveAnalysis: (guideId: string, fields: Partial<AIAnalysisResult>) =>
    apiClient<{ success: boolean; guideId: string; savedFields: string[] }>(
      `/ai/analyze/${guideId}/save`,
      {
        method: 'POST',
        body: JSON.stringify({ fields }),
      }
    ),
};
