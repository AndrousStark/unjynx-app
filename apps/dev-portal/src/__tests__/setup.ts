// ============================================================
// UNJYNX Dev Portal - Test Setup
// ============================================================

import "@testing-library/jest-dom";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  try {
    return originalGetComputedStyle(elt, pseudoElt);
  } catch {
    return {} as CSSStyleDeclaration;
  }
};

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
});

// Mock import.meta.env
vi.stubGlobal("import.meta", {
  env: {
    VITE_API_URL: "http://localhost:3000",
    VITE_GRAFANA_URL: "http://localhost:3100",
    VITE_LOGTO_AUTHORITY: "http://localhost:3301/oidc",
    VITE_LOGTO_CLIENT_ID: "test-client",
    VITE_LOGTO_REDIRECT: "http://localhost:3002/callback",
  },
});

// Suppress Ant Design warning noise in tests
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("[antd:") || msg.includes("Warning:")) return;
  originalConsoleWarn(...args);
};

// Suppress Ant Design error noise in tests
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("Warning:") || msg.includes("act(")) return;
  originalConsoleError(...args);
};
