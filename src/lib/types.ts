export interface PerformanceRecord {
  beatmapId: number;
  score: number;
  accuracy: number;
  missCount: number;
  confidence: 'needs_work' | 'practicing' | 'ready';
  lastUpdated: string;
  isManual: boolean;
}
