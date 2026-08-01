import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  const storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  return storage as unknown as Storage;
}

const memory = createMemoryStorage();
try {
  Object.defineProperty(window, 'localStorage', { value: memory, configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: memory, configurable: true });
} catch {
  (window as unknown as Record<string, unknown>).localStorage = memory;
  (window as unknown as Record<string, unknown>).sessionStorage = memory;
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
}

window.scrollTo = (() => {}) as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  memory.clear();
  document.documentElement.className = '';
});
