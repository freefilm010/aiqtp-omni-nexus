/**
 * Distributed Execution Engine
 * Uses Web Workers for parallel backtest / simulation runs in the browser.
 */

export interface WorkerTask<T = unknown> {
  id: string;
  payload: T;
}

export interface WorkerResult<R = unknown> {
  id: string;
  result: R;
  durationMs: number;
  error?: string;
}

/**
 * Run tasks in parallel using a pool of Web Workers.
 * @param workerUrl  URL from `new URL('./worker.ts', import.meta.url)`
 * @param tasks      Array of payloads to distribute
 * @param poolSize   Max concurrent workers (default: navigator.hardwareConcurrency)
 */
export async function runParallel<T, R>(
  workerUrl: URL,
  tasks: WorkerTask<T>[],
  poolSize: number = navigator.hardwareConcurrency ?? 4
): Promise<WorkerResult<R>[]> {
  const results: WorkerResult<R>[] = [];
  const queue = [...tasks];

  async function runOne(task: WorkerTask<T>): Promise<WorkerResult<R>> {
    return new Promise((resolve) => {
      const start = performance.now();
      const worker = new Worker(workerUrl, { type: "module" });

      const timeout = setTimeout(() => {
        worker.terminate();
        resolve({
          id: task.id,
          result: undefined as unknown as R,
          durationMs: performance.now() - start,
          error: "Worker timeout (60s)",
        });
      }, 60_000);

      worker.onmessage = (e: MessageEvent<R>) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve({
          id: task.id,
          result: e.data,
          durationMs: performance.now() - start,
        });
      };

      worker.onerror = (err) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve({
          id: task.id,
          result: undefined as unknown as R,
          durationMs: performance.now() - start,
          error: err.message ?? "Worker error",
        });
      };

      worker.postMessage(task.payload);
    });
  }

  // Process queue with bounded concurrency
  const executing = new Set<Promise<void>>();

  for (const task of queue) {
    const p = runOne(task).then((r) => {
      results.push(r);
      executing.delete(p);
    });
    executing.add(p);

    if (executing.size >= poolSize) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  return results.sort(
    (a, b) => tasks.findIndex((t) => t.id === a.id) - tasks.findIndex((t) => t.id === b.id)
  );
}

/**
 * Helper: create a backtest worker inline (for simple cases).
 */
export function createBacktestWorkerBlob(
  backtestFnSource: string
): URL {
  const code = `
    ${backtestFnSource}
    self.onmessage = function(e) {
      const result = runBacktest(e.data);
      self.postMessage(result);
    };
  `;
  const blob = new Blob([code], { type: "application/javascript" });
  return new URL(URL.createObjectURL(blob));
}
