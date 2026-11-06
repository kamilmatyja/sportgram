import { api } from '../client';
import type { components } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type UserSignDto = components['schemas']['UserSignDto'];
export type UserCodeDto = components['schemas']['UserCodeDto'];
export type UserEmailDto = components['schemas']['UserEmailDto'];
export type UserPasswordDto = components['schemas']['UserPasswordDto'];

export const authService = {
    async sign(req?: ApiRequest<'post_user_sign'>): Promise<ApiResponse<'post_user_sign'>> {
        const res = await api.POST('/api/signs', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_sign'>;
    },
    async confirmSign(req?: ApiRequest<'patch_user_sign_confirm'>): Promise<ApiResponse<'patch_user_sign_confirm'>> {
        const res = await api.PATCH('/api/signs/{id}/confirm', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_user_sign_confirm'>;
    },
    async resendSign(req?: ApiRequest<'post_user_sign_resend'>): Promise<ApiResponse<'post_user_sign_resend'>> {
        const res = await api.POST('/api/signs/{id}/resend', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_sign_resend'>;
    },
    async refreshSign(req?: ApiRequest<'post_user_sign_refresh'>): Promise<ApiResponse<'post_user_sign_refresh'>> {
        const res = await api.POST('/api/signs/{id}/refresh', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_sign_refresh'>;
    },
    async register(req?: ApiRequest<'post_user_register'>): Promise<ApiResponse<'post_user_register'>> {
        const res = await api.POST('/api/registers', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_register'>;
    },
    async confirmRegister(
        req?: ApiRequest<'patch_user_register_confirm'>,
    ): Promise<ApiResponse<'patch_user_register_confirm'>> {
        const res = await api.PATCH('/api/registers/{id}/confirm', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_user_register_confirm'>;
    },
    async resendRegister(
        req?: ApiRequest<'post_user_register_resend'>,
    ): Promise<ApiResponse<'post_user_register_resend'>> {
        const res = await api.POST('/api/registers/{id}/resend', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_register_resend'>;
    },
    async passwordReset(
        req?: ApiRequest<'post_user_password_reset'>,
    ): Promise<ApiResponse<'post_user_password_reset'>> {
        const res = await api.POST('/api/password-resets', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_password_reset'>;
    },
    async confirmPasswordReset(
        req?: ApiRequest<'patch_user_password_reset_confirm'>,
    ): Promise<ApiResponse<'patch_user_password_reset_confirm'>> {
        const res = await api.PATCH('/api/password-resets/{id}/confirm', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_user_password_reset_confirm'>;
    },
    async resendPasswordReset(
        req?: ApiRequest<'post_user_password_reset_resend'>,
    ): Promise<ApiResponse<'post_user_password_reset_resend'>> {
        const res = await api.POST('/api/password-resets/{id}/resend', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_password_reset_resend'>;
    },
};
