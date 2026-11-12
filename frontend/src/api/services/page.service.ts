import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type PageResource = components['schemas']['PageResource'];
export type PageDto = components['schemas']['PageDto'];
export type PageFilterDto = components['schemas']['PageFilterDto'];
export type PageParticipantResource = components['schemas']['PageParticipantResource'];
export type PageFollowResource = components['schemas']['PageFollowResource'];

export type GetPagesQuery = operations['get_page_index']['parameters']['query'];
export type GetPageDetailsQuery = operations['get_page_details']['parameters']['query'];
export type GetPageFollowsQuery = operations['get_page_follow_index']['parameters']['query'];

export const pageService = {
    async getPages(req: ApiRequest<'get_page_index'>): Promise<ApiResponse<'get_page_index'>> {
        const res = await api.GET('/api/pages', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async createPage(req: ApiRequest<'post_page_create'>): Promise<ApiResponse<'post_page_create'>> {
        const res = await api.POST('/api/pages', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getPage(req: ApiRequest<'get_page_details'>): Promise<ApiResponse<'get_page_details'>> {
        const res = await api.GET('/api/pages/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updatePage(req: ApiRequest<'put_page_update'>): Promise<ApiResponse<'put_page_update'>> {
        const res = await api.PUT('/api/pages/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async deletePage(req: ApiRequest<'delete_page_delete'>): Promise<ApiResponse<'delete_page_delete'>> {
        const res = await api.DELETE('/api/pages/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updatePageStatus(
        req: ApiRequest<'patch_page_patch_status'>,
    ): Promise<ApiResponse<'patch_page_patch_status'>> {
        const res = await api.PATCH('/api/pages/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updatePageParticipantStatus(
        req: ApiRequest<'patch_page_participant_patch_status'>,
    ): Promise<ApiResponse<'patch_page_participant_patch_status'>> {
        const res = await api.PATCH('/api/page-participants/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async createPageFollow(
        req: ApiRequest<'post_page_follow_create'>,
    ): Promise<ApiResponse<'post_page_follow_create'>> {
        const res = await api.POST('/api/pages/{id}/follows', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updatePageFollowStatus(
        req: ApiRequest<'patch_page_follow_patch_status'>,
    ): Promise<ApiResponse<'patch_page_follow_patch_status'>> {
        const res = await api.PATCH('/api/page-follows/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getPageFollow(req: ApiRequest<'get_page_follow_details'>): Promise<ApiResponse<'get_page_follow_details'>> {
        const res = await api.GET('/api/page-follows/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async deletePageFollow(
        req: ApiRequest<'delete_page_follow_delete'>,
    ): Promise<ApiResponse<'delete_page_follow_delete'>> {
        const res = await api.DELETE('/api/page-follows/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getPageFollows(req: ApiRequest<'get_page_follow_index'>): Promise<ApiResponse<'get_page_follow_index'>> {
        const res = await api.GET('/api/page-follows', req);
        if (res.error) throw res.error;
        return res.data;
    },
};
