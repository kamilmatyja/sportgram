import { describe, expect, it } from 'vitest';
import { extractFieldErrors, getErrorMessage, unwrap } from './client';

describe('API error normalization', () => {
    it('extracts field errors from different backend validation shapes', () => {
        expect(
            extractFieldErrors({
                violations: [
                    { propertyPath: 'email', message: 'Invalid address' },
                    { field: 'email', detail: 'Already used' },
                    { path: 'password', error: 'Too short' },
                    null,
                    { message: 'Missing field name' },
                ],
            }),
        ).toEqual({
            email: 'Invalid address, Already used',
            password: 'Too short',
        });

        expect(
            extractFieldErrors({
                details: {
                    title: ['Required', { message: 'Too short' }],
                    link: { message: 'Already used' },
                },
            }),
        ).toEqual({ title: 'Required, Too short', link: 'Already used' });
    });

    it('safely handles empty and malformed error values', () => {
        expect(extractFieldErrors(null)).toEqual({});
        expect(extractFieldErrors('invalid')).toEqual({});
        expect(extractFieldErrors({ errors: [null, {}, { field: 12, message: 'Ignored' }] })).toEqual({});
        expect(getErrorMessage({ errors: [] })).toBe('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    });

    it('prefers validation feedback over a generic message and preserves server messages', () => {
        expect(getErrorMessage({ message: 'Invalid', errors: { email: 'Malformed' } })).toBe('Błąd walidacji');
        expect(getErrorMessage({ detail: 'Service unavailable' })).toBe('Service unavailable');
        expect(getErrorMessage('Request failed')).toBe('Request failed');
    });

    it('returns API data and rejects API errors', async () => {
        await expect(unwrap(Promise.resolve({ data: { id: 'user-1' } }))).resolves.toEqual({ id: 'user-1' });
        await expect(unwrap(Promise.resolve({ error: new Error('Rejected') }))).rejects.toThrow('Rejected');
    });
});
