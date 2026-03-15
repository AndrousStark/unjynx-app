import "@testing-library/jest-dom";

// Mock import.meta.env
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_API_URL: "http://localhost:3000",
    VITE_LOGTO_ENDPOINT: "http://localhost:3301",
    VITE_LOGTO_APP_ID: "test-admin-app",
    VITE_LOGTO_REDIRECT_URI: "http://localhost:3001/callback",
  },
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
});

// Suppress Ant Design act warnings in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === "string" ? args[0] : "";
  if (
    message.includes("Warning: An update to") ||
    message.includes("act(...)") ||
    message.includes("Not implemented: HTMLCanvasElement")
  ) {
    return;
  }
  originalError.apply(console, args);
};
