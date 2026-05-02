/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by stopping calls to failing services.
 * Inspired by: Knight Capital ($440M loss from cascading failures),
 * CME Nov 2025 data center outage, Robinhood March 2020 infrastructure collapse.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately  
 * - HALF_OPEN: Testing if service has recovered
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeout?: number;
  /** Time window in ms to count failures (default: 60000) */
  failureWindow?: number;
  /** Optional fallback value when circuit is open */
  fallback?: () => unknown;
  /** Name for logging */
  name?: string;
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  lastAttemptTime: number;
  successCount: number;
}

const circuits = new Map<string, CircuitBreakerState>();

function getCircuit(name: string): CircuitBreakerState {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      lastAttemptTime: 0,
      successCount: 0,
    });
  }
  return circuits.get(name)!;
}

/**
 * Execute a function with circuit breaker protection.
 * 
 * Usage:
 * ```ts
 * const data = await withCircuitBreaker('coingecko', () => fetchPrices(), {
 *   failureThreshold: 3,
 *   resetTimeout: 60000,
 *   fallback: () => cachedPrices,
 * });
 * ```
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options: CircuitBreakerOptions = {}
): Promise<T> {
  const {
    failureThreshold = 5,
    resetTimeout = 30000,
    failureWindow = 60000,
    fallback,
  } = options;

  const circuit = getCircuit(name);
  const now = Date.now();

  // Reset failure count if outside window
  if (circuit.failures > 0 && now - circuit.lastFailureTime > failureWindow) {
    circuit.failures = 0;
  }

  // Check circuit state
  if (circuit.state === 'OPEN') {
    if (now - circuit.lastAttemptTime > resetTimeout) {
      // Transition to half-open, allow one test request
      circuit.state = 'HALF_OPEN';
      circuit.lastAttemptTime = now;
      if (import.meta.env.DEV) console.log(`[CircuitBreaker:${name}] HALF_OPEN — testing recovery`);
    } else {
      console.warn(`[CircuitBreaker:${name}] OPEN — rejecting request`);
      if (fallback) return fallback() as T;
      throw new CircuitBreakerError(name, 'Circuit is OPEN — service unavailable');
    }
  }

  try {
    const result = await fn();

    // Success — close circuit
    if (circuit.state === 'HALF_OPEN') {
      if (import.meta.env.DEV) console.log(`[CircuitBreaker:${name}] Service recovered → CLOSED`);
    }
    circuit.state = 'CLOSED';
    circuit.failures = 0;
    circuit.successCount++;
    return result;
  } catch (error) {
    circuit.failures++;
    circuit.lastFailureTime = now;
    circuit.lastAttemptTime = now;

    if (circuit.failures >= failureThreshold) {
      circuit.state = 'OPEN';
      console.error(
        `[CircuitBreaker:${name}] OPEN after ${circuit.failures} failures. ` +
        `Will retry in ${resetTimeout / 1000}s`
      );
    }

    if (fallback && circuit.state === 'OPEN') {
      return fallback() as T;
    }

    throw error;
  }
}

/**
 * Get the current state of a circuit breaker.
 */
export function getCircuitState(name: string): CircuitState {
  return getCircuit(name).state;
}

/**
 * Manually reset a circuit breaker.
 */
export function resetCircuit(name: string): void {
  circuits.delete(name);
}

/**
 * Get all circuit breaker statuses for monitoring.
 */
export function getAllCircuitStates(): Record<string, { state: CircuitState; failures: number }> {
  const states: Record<string, { state: CircuitState; failures: number }> = {};
  circuits.forEach((circuit, name) => {
    states[name] = { state: circuit.state, failures: circuit.failures };
  });
  return states;
}

export class CircuitBreakerError extends Error {
  public readonly circuitName: string;
  constructor(circuitName: string, message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.circuitName = circuitName;
  }
}
