import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

localStorage.setItem('sportgram_lang', 'pl');
Object.defineProperty(navigator, 'language', { value: 'pl-PL', configurable: true });

import i18n from '../i18n';

beforeEach(async () => {
    if (!i18n.isInitialized) {
        await new Promise<void>((resolve) => i18n.on('initialized', () => resolve()));
    }
    await i18n.changeLanguage('pl');
});

Object.defineProperty(window, 'matchMedia', {
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

globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

globalThis.location = window.location;

const OriginalRequest = globalThis.Request;
globalThis.Request = class extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
        if (typeof input === 'string' && input.startsWith('/')) {
            input = `http://localhost:5173${input}`;
        }
        super(input, init);
    }
};

const originalFetch = globalThis.fetch;
let currentFetchHandler: typeof fetch = originalFetch;

export function setTestFetchHandler(handler: typeof fetch) {
    currentFetchHandler = handler;
}

export function resetTestFetchHandler() {
    currentFetchHandler = originalFetch;
}

globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    return currentFetchHandler(input, init);
};

afterEach(() => {
    cleanup();
    resetTestFetchHandler();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
