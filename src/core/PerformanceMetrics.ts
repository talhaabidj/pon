import type { WebGLRenderer } from 'three';

const SAMPLE_WINDOW_SIZE = 240;
const PING_SAMPLE_INTERVAL_MS = 2000;
const PING_TIMEOUT_MS = 1600;

interface BrowserMemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface BrowserPerformance extends Performance {
  memory?: BrowserMemoryStats;
}

interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
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
}

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor(sortedValues.length * p)),
  );
  return sortedValues[index] ?? 0;
}

export class PerformanceMetricsTracker {
  private readonly frameTimes = new Float32Array(SAMPLE_WINDOW_SIZE);
  private frameCursor = 0;
  private frameCount = 0;
  private fpsSmoothed = 60;
  private nextPingProbeAtMs = 0;
  private pingProbeInFlight = false;
  private pingSmoothedMs: number | null = null;
  private pingJitterMs: number | null = null;

  private snapshot: PerformanceSnapshot = {
    sceneName: 'None',
    fps: 0,
    fpsSmoothed: 0,
    fpsLow1: 0,
    frameTimeMs: 0,
    frameTimeAvgMs: 0,
    frameTimeP95Ms: 0,
    frameTimeWorstMs: 0,
    frameBudgetUsagePercent: 0,
    stepTimeMs: 0,
    drawCalls: 0,
    triangles: 0,
    lines: 0,
    points: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    pixelRatio: 1,
    canvasWidth: 0,
    canvasHeight: 0,
    viewportWidth: 0,
    viewportHeight: 0,
    visibility: 'visible',
    paused: false,
    pingMs: null,
    pingJitterMs: null,
    networkType: null,
    downlinkMbps: null,
    heapUsedMB: null,
    heapTotalMB: null,
    heapLimitMB: null,
  };

  sample(
    frameDeltaMs: number,
    stepTimeMs: number,
    renderer: WebGLRenderer,
    paused: boolean,
    sceneName: string | null,
    nowMs: number,
  ): PerformanceSnapshot {
    const clampedFrameDeltaMs = Math.max(0.0001, frameDeltaMs);
    this.frameTimes[this.frameCursor] = clampedFrameDeltaMs;
    this.frameCursor = (this.frameCursor + 1) % SAMPLE_WINDOW_SIZE;
    this.frameCount = Math.min(this.frameCount + 1, SAMPLE_WINDOW_SIZE);

    const fps = 1000 / clampedFrameDeltaMs;
    this.fpsSmoothed += (fps - this.fpsSmoothed) * 0.1;

    let frameSum = 0;
    let frameWorst = 0;
    const sortedFrameTimes: number[] = [];
    for (let i = 0; i < this.frameCount; i += 1) {
      const sampleValue = this.frameTimes[i] ?? 0;
      frameSum += sampleValue;
      if (sampleValue > frameWorst) frameWorst = sampleValue;
      sortedFrameTimes.push(sampleValue);
    }
    sortedFrameTimes.sort((a, b) => a - b);

    const frameAvg = this.frameCount > 0 ? frameSum / this.frameCount : 0;
    const frameP95 = percentile(sortedFrameTimes, 0.95);
    const frameP99 = percentile(sortedFrameTimes, 0.99);
    const fpsLow1 = frameP99 > 0 ? 1000 / frameP99 : 0;

    const info = renderer.info;
    const infoWithPrograms = info as typeof info & { programs?: unknown[] };
    const programs = Array.isArray(infoWithPrograms.programs)
      ? infoWithPrograms.programs.length
      : 0;

    const navigatorWithConnection = navigator as NavigatorWithConnection;
    const connection =
      navigatorWithConnection.connection ??
      navigatorWithConnection.mozConnection ??
      navigatorWithConnection.webkitConnection;
    const networkType = typeof connection?.effectiveType === 'string'
      ? connection.effectiveType
      : null;
    const downlinkMbps = typeof connection?.downlink === 'number'
      ? round(connection.downlink, 2)
      : null;
    const connectionRtt = typeof connection?.rtt === 'number'
      ? connection.rtt
      : null;

    this.maybeProbePing(nowMs);

    const browserPerformance = performance as BrowserPerformance;
    const heap = browserPerformance.memory;
    const pingMs = this.pingSmoothedMs ?? connectionRtt ?? null;

    this.snapshot = {
      sceneName: sceneName ?? 'None',
      fps: round(fps, 1),
      fpsSmoothed: round(this.fpsSmoothed, 1),
      fpsLow1: round(fpsLow1, 1),
      frameTimeMs: round(clampedFrameDeltaMs, 2),
      frameTimeAvgMs: round(frameAvg, 2),
      frameTimeP95Ms: round(frameP95, 2),
      frameTimeWorstMs: round(frameWorst, 2),
      frameBudgetUsagePercent: round((clampedFrameDeltaMs / 16.67) * 100, 1),
      stepTimeMs: round(stepTimeMs, 2),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      lines: info.render.lines,
      points: info.render.points,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs,
      pixelRatio: round(renderer.getPixelRatio(), 2),
      canvasWidth: renderer.domElement.width,
      canvasHeight: renderer.domElement.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      visibility: document.visibilityState,
      paused,
      pingMs: pingMs == null ? null : round(pingMs, 1),
      pingJitterMs: this.pingJitterMs == null ? null : round(this.pingJitterMs, 1),
      networkType,
      downlinkMbps,
      heapUsedMB: heap ? round(bytesToMB(heap.usedJSHeapSize), 1) : null,
      heapTotalMB: heap ? round(bytesToMB(heap.totalJSHeapSize), 1) : null,
      heapLimitMB: heap ? round(bytesToMB(heap.jsHeapSizeLimit), 1) : null,
    };

    return this.snapshot;
  }

  getSnapshot(): PerformanceSnapshot {
    return this.snapshot;
  }

  private maybeProbePing(nowMs: number) {
    if (this.pingProbeInFlight) return;
    if (nowMs < this.nextPingProbeAtMs) return;

    this.pingProbeInFlight = true;
    this.nextPingProbeAtMs = nowMs + PING_SAMPLE_INTERVAL_MS;
    void this.probePing().finally(() => {
      this.pingProbeInFlight = false;
    });
  }

  private async probePing() {
    const startMs = performance.now();
    const pingTarget = new URL('/favicon.ico', window.location.href);
    pingTarget.searchParams.set('__perf_ping', `${Math.floor(startMs)}`);

    const controller = typeof AbortController !== 'undefined'
      ? new AbortController()
      : null;
    const timeoutId = window.setTimeout(() => {
      controller?.abort();
    }, PING_TIMEOUT_MS);

    try {
      const response = await fetch(pingTarget.toString(), {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller?.signal,
      });
      if (!response.ok) {
        return;
      }

      const sampleMs = performance.now() - startMs;
      if (this.pingSmoothedMs == null) {
        this.pingSmoothedMs = sampleMs;
        this.pingJitterMs = 0;
        return;
      }

      const previousSmoothed = this.pingSmoothedMs;
      const jitterSample = Math.abs(sampleMs - previousSmoothed);

      this.pingSmoothedMs += (sampleMs - previousSmoothed) * 0.2;
      this.pingJitterMs = this.pingJitterMs == null
        ? jitterSample
        : this.pingJitterMs + (jitterSample - this.pingJitterMs) * 0.2;
    } catch {
      // Ignore transient probe errors; fallback values remain in snapshot.
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
