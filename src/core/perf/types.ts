export interface BrowserMemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface BrowserPerformance extends Performance {
  memory?: BrowserMemoryStats;
}

export interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
}

export interface PerformanceSnapshot {
  sceneName: string;
  fps: number;
  fpsSmoothed: number;
  fpsLow1: number;
  frameTimeMs: number;
  frameTimeAvgMs: number;
  frameTimeP95Ms: number;
  frameTimeWorstMs: number;
  frameBudgetUsagePercent: number;
  stepTimeMs: number;
  drawCalls: number;
  triangles: number;
  lines: number;
  points: number;
  geometries: number;
  textures: number;
  programs: number;
  pixelRatio: number;
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  visibility: DocumentVisibilityState;
  paused: boolean;
  pingMs: number | null;
  pingJitterMs: number | null;
  networkType: string | null;
  downlinkMbps: number | null;
  heapUsedMB: number | null;
  heapTotalMB: number | null;
  heapLimitMB: number | null;
  longTaskCount: number;
  longTaskRatePerMin: number;
  longTaskTotalMs: number;
  longTaskWorstMs: number;
}
