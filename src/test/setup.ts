import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25 ships an experimental native localStorage that shadows jsdom's
// Storage implementation but is not functional (no setItem/getItem methods).
// Replace globalThis + window.localStorage/sessionStorage with a working
// in-memory Storage-like shim so tests that use localStorage behave normally.
function createStorageShim(): Storage {
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() { return store.size; },
    clear: () => { store.clear(); },
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => { store.delete(k); },
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
  };
  return shim;
}

const localStorageShim = createStorageShim();
const sessionStorageShim = createStorageShim();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageShim,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageShim,
  configurable: true,
  writable: true,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageShim,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageShim,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
  localStorageShim.clear();
  sessionStorageShim.clear();
});
