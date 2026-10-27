import { api } from '../client';
import type { components, operations } from '../schema';

export type UserSignDto = components['schemas']['UserSignDto'];
export type UserCodeDto = components['schemas']['UserCodeDto'];
export type UserEmailDto = components['schemas']['UserEmailDto'];
export type UserPasswordDto = components['schemas']['UserPasswordDto'];

export type SignResponse = operations['post_user_sign']['responses'][201]['content']['application/json'];
export type ConfirmSignResponse =
    operations['patch_user_sign_confirm']['responses'][200]['content']['application/json'];
export type ResendSignResponse = operations['post_user_sign_resend']['responses'][200]['content']['application/json'];
export type RefreshSignResponse = operations['post_user_sign_refresh']['responses'][200]['content']['application/json'];
export type RegisterResponse = operations['post_user_register']['responses'][201]['content']['application/json'];
export type ConfirmRegisterResponse =
    operations['patch_user_register_confirm']['responses'][200]['content']['application/json'];
export type ResendRegisterResponse =
    operations['post_user_register_resend']['responses'][200]['content']['application/json'];
export type PasswordResetResponse =
    operations['post_user_password_reset']['responses'][201]['content']['application/json'];
export type ConfirmPasswordResetResponse =
    operations['patch_user_password_reset_confirm']['responses'][200]['content']['application/json'];
export type ResendPasswordResetResponse =
    operations['post_user_password_reset_resend']['responses'][200]['content']['application/json'];
export type RegisterNanoResponse = operations['post_user_create_nano']['responses'][201]['content']['application/json'];

export const authService = {
    async sign(body: UserSignDto): Promise<SignResponse> {
        const res = await api.POST('/api/signs', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async confirmSign(id: string, body: UserCodeDto | number): Promise<ConfirmSignResponse> {
        const codePayload: UserCodeDto = typeof body === 'number' ? { code: body } : body;
        const res = await api.PATCH('/api/signs/{id}/confirm', {
            params: { path: { id } },
            body: codePayload,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async resendSign(id: string): Promise<ResendSignResponse> {
        const res = await api.POST('/api/signs/{id}/resend', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async refreshSign(id: string): Promise<RefreshSignResponse> {
        const res = await api.POST('/api/signs/{id}/refresh', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async register(body: UserEmailDto | string): Promise<RegisterResponse> {
        const emailPayload: UserEmailDto = typeof body === 'string' ? { email: body } : body;
        const res = await api.POST('/api/registers', { body: emailPayload });
        if (res.error) throw res.error;
        return res.data;
    },

    async confirmRegister(id: string, body: UserCodeDto | number): Promise<ConfirmRegisterResponse> {
        const codePayload: UserCodeDto = typeof body === 'number' ? { code: body } : body;
        const res = await api.PATCH('/api/registers/{id}/confirm', {
            params: { path: { id } },
            body: codePayload,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async resendRegister(id: string): Promise<ResendRegisterResponse> {
        const res = await api.POST('/api/registers/{id}/resend', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async passwordReset(body: UserEmailDto | string): Promise<PasswordResetResponse> {
        const emailPayload: UserEmailDto = typeof body === 'string' ? { email: body } : body;
        const res = await api.POST('/api/password-resets', { body: emailPayload });
        if (res.error) throw res.error;
        return res.data;
    },

    async confirmPasswordReset(id: string, body: UserPasswordDto): Promise<ConfirmPasswordResetResponse> {
        const res = await api.PATCH('/api/password-resets/{id}/confirm', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async resendPasswordReset(id: string): Promise<ResendPasswordResetResponse> {
        const res = await api.POST('/api/password-resets/{id}/resend', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async registerNano(body: components['schemas']['UserCreateNanoDto']): Promise<RegisterNanoResponse> {
        const res = await api.POST('/api/user-nano', { body });
        if (res.error) throw res.error;
        return res.data;
    },
};
