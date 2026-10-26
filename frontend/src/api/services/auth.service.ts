import { api } from '../client';
import type { components } from '../schema';

export type UserNanoDto = components['schemas']['UserNanoDto'];
export type SignDto = components['schemas']['SignDto'];
export type ConfirmDto = components['schemas']['ConfirmDto'];
export type PasswordResetConfirmDto = components['schemas']['PasswordResetConfirmDto'];
export type PasswordResetDto = components['schemas']['PasswordResetDto'];
export type RegisterDto = components['schemas']['RegisterDto'];

export const authService = {
    async sign(body: SignDto) {
        const res = await api.POST('/api/signs', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async confirmSign(id: string, code: number) {
        const res = await api.PATCH('/api/signs/{id}/confirm', {
            params: { path: { id } },
            body: { code },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async resendSign(id: string) {
        const res = await api.POST('/api/signs/{id}/resend', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async refreshSign(id: string) {
        const res = await api.POST('/api/signs/{id}/refresh', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async registerNano(body: UserNanoDto) {
        const res = await api.POST('/api/user-nano', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async register(email: string) {
        const res = await api.POST('/api/registers', { body: { email } });
        if (res.error) throw res.error;
        return res.data;
    },

    async confirmRegister(id: string, code: number) {
        const res = await api.PATCH('/api/registers/{id}/confirm', {
            params: { path: { id } },
            body: { code },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async resendRegister(id: string) {
        const res = await api.POST('/api/registers/{id}/resend', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async passwordReset(email: string) {
        const res = await api.POST('/api/password-resets', { body: { email } });
        if (res.error) throw res.error;
        return res.data;
    },

    async confirmPasswordReset(id: string, body: PasswordResetConfirmDto) {
        const res = await api.PATCH('/api/password-resets/{id}/confirm', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async resendPasswordReset(id: string) {
        const res = await api.POST('/api/password-resets/{id}/resend', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
