import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver for react-grid-layout
globalThis.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver for react-grid-layout
globalThis.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock performance.mark and performance.measure for benchmarking
if (!globalThis.performance.mark) {
  globalThis.performance.mark = vi.fn();
}
if (!globalThis.performance.measure) {
  globalThis.performance.measure = vi.fn();
}

// Mock requestAnimationFrame
globalThis.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
globalThis.cancelAnimationFrame = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
globalThis.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
globalThis.sessionStorage = sessionStorageMock;

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window dimensions for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
});

// Console setup for better test output
globalThis.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: console.warn,
  error: console.error,
};