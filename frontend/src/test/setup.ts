import '@testing-library/jest-dom/vitest';

localStorage.setItem('sportgram_lang', 'pl');
Object.defineProperty(navigator, 'language', { value: 'pl-PL', configurable: true });

import i18n from '../i18n';

void i18n.changeLanguage('pl');

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

globalThis.location = window.location;

const OriginalRequest = globalThis.Request;
globalThis.Request = class extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
        if (typeof input === 'string' && input.startsWith('/')) {
            input = `http://localhost:5173${input}`;
        }
        super(input, init);
    }
} as typeof OriginalRequest;

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
