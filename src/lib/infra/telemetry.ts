/**
 * Telemetry — Structured logging, metrics, and tracing for the simulation platform.
 */

// ── Metric Types ────────────────────────────────────────────

export interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime: number;
  attributes: Record<string, string | number>;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: Record<string, unknown>;
  timestamp: number;
}

// ── Telemetry Engine ────────────────────────────────────────

export class Telemetry {
  private metrics: MetricPoint[] = [];
  private spans: TraceSpan[] = [];
  private logs: LogEntry[] = [];
  private seq = 0;

  // ── Logging ───────────────────────────────────────────────

  log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
    const entry: LogEntry = { level, message, context, timestamp: Date.now() };
    this.logs.push(entry);
    if (this.logs.length > 2000) this.logs.shift();
  }

  debug(msg: string, ctx?: Record<string, unknown>): void { this.log("debug", msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>): void { this.log("info", msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>): void { this.log("warn", msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>): void { this.log("error", msg, ctx); }

  // ── Metrics ───────────────────────────────────────────────

  metric(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({ name, value, tags, timestamp: Date.now() });
    if (this.metrics.length > 5000) this.metrics.shift();
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.metric(name, value, tags);
  }

  counter(name: string, increment = 1, tags?: Record<string, string>): void {
    this.metric(name, increment, { ...tags, type: "counter" });
  }

  histogram(name: string, value: number, tags?: Record<string, string>): void {
    this.metric(name, value, { ...tags, type: "histogram" });
  }

  // ── Tracing ───────────────────────────────────────────────

  startSpan(name: string, attributes: Record<string, string | number> = {}): TraceSpan {
    const span: TraceSpan = {
      traceId: `trace_${this.seq++}`,
      spanId: `span_${this.seq++}`,
      name,
      startTime: Date.now(),
      endTime: 0,
      attributes,
    };
    this.spans.push(span);
    if (this.spans.length > 1000) this.spans.shift();
    return span;
  }

  endSpan(span: TraceSpan): void {
    span.endTime = Date.now();
  }

  /** Measure execution time of an operation. */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const span = this.startSpan(name);
    try {
      const result = await fn();
      this.endSpan(span);
      this.histogram(`${name}_duration_ms`, span.endTime - span.startTime);
      return result;
    } catch (err) {
      this.endSpan(span);
      this.error(`${name} failed`, { error: String(err) });
      throw err;
    }
  }

  // ── Queries ───────────────────────────────────────────────

  getMetrics(name?: string): MetricPoint[] {
    return name ? this.metrics.filter((m) => m.name === name) : [...this.metrics];
  }

  getLogs(level?: LogLevel): LogEntry[] {
    return level ? this.logs.filter((l) => l.level === level) : [...this.logs];
  }

  getSpans(): TraceSpan[] {
    return [...this.spans];
  }

  /** Summary stats for a named metric. */
  summarize(name: string): { count: number; min: number; max: number; avg: number } {
    const points = this.metrics.filter((m) => m.name === name);
    if (points.length === 0) return { count: 0, min: 0, max: 0, avg: 0 };
    const values = points.map((p) => p.value);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }

  /** Clear all telemetry data. */
  flush(): void {
    this.metrics = [];
    this.spans = [];
    this.logs = [];
  }
}
