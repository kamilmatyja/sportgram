import { api } from '../client';
import type { components, operations } from '../schema';
import type { ElementStatusDto } from './common.types';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';

export type PageResource = components['schemas']['PageResource'];
export type PageDto = components['schemas']['PageDto'];
export type PageFilterDto = components['schemas']['PageFilterDto'];
export type PageFollowResource = components['schemas']['PageFollowResource'];
export type PageFollowFilterDto = components['schemas']['PageFollowFilterDto'];
export type PageFollowStatusDto = components['schemas']['PageFollowStatusDto'];
export type PageParticipantResource = components['schemas']['PageParticipantResource'];

export type GetPagesQuery = operations['get_page_index']['parameters']['query'];
export type GetPageDetailsQuery = operations['get_page_details']['parameters']['query'];
export type GetPageFollowsQuery = operations['get_page_follow_index']['parameters']['query'];

export type GetPagesResponse = operations['get_page_index']['responses'][200]['content']['application/json'];
export type CreatePageResponse = operations['post_page_create']['responses'][201]['content']['application/json'];
export type GetPageResponse = operations['get_page_details']['responses'][200]['content']['application/json'];
export type UpdatePageResponse = operations['put_page_update']['responses'][200]['content']['application/json'];
export type DeletePageResponse = operations['delete_page_delete']['responses'][200]['content']['application/json'];
export type UpdatePageStatusResponse =
    operations['patch_page_patch_status']['responses'][200]['content']['application/json'];
export type UpdatePageParticipantStatusResponse =
    operations['patch_page_participant_patch_status']['responses'][200]['content']['application/json'];
export type CreatePageFollowResponse =
    operations['post_page_follow_create']['responses'][201]['content']['application/json'];
export type GetPageFollowsResponse =
    operations['get_page_follow_index']['responses'][200]['content']['application/json'];
export type GetPageFollowResponse =
    operations['get_page_follow_details']['responses'][200]['content']['application/json'];
export type DeletePageFollowResponse =
    operations['delete_page_follow_delete']['responses'][200]['content']['application/json'];
export type UpdatePageFollowStatusResponse =
    operations['patch_page_follow_patch_status']['responses'][200]['content']['application/json'];

export const pageService = {
    async getPages(query?: GetPagesQuery): Promise<GetPagesResponse> {
        const res = await api.GET('/api/pages', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createPage(body: PageDto): Promise<CreatePageResponse> {
        const res = await api.POST('/api/pages', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getPage(id: string, query?: GetPageDetailsQuery): Promise<GetPageResponse> {
        const res = await api.GET('/api/pages/{id}', {
            params: { path: { id }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updatePage(id: string, body: PageDto): Promise<UpdatePageResponse> {
        const res = await api.PUT('/api/pages/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deletePage(id: string): Promise<DeletePageResponse> {
        const res = await api.DELETE('/api/pages/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updatePageStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdatePageStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/pages/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updatePageParticipantStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdatePageParticipantStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/page-participants/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createPageFollow(
        pageId: string,
        bodyOrStatus: PageFollowStatusDto | PageFollowStatusEnum,
    ): Promise<CreatePageFollowResponse> {
        const body: PageFollowStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as PageFollowStatusDto['status'] } : bodyOrStatus;
        const res = await api.POST('/api/pages/{id}/follows', {
            params: { path: { id: pageId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getPageFollowsList(query?: GetPageFollowsQuery): Promise<GetPageFollowsResponse> {
        const res = await api.GET('/api/page-follows', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getPageFollow(id: string): Promise<GetPageFollowResponse> {
        const res = await api.GET('/api/page-follows/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deletePageFollow(id: string): Promise<DeletePageFollowResponse> {
        const res = await api.DELETE('/api/page-follows/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updatePageFollowStatus(
        id: string,
        bodyOrStatus: PageFollowStatusDto | PageFollowStatusEnum,
    ): Promise<UpdatePageFollowStatusResponse> {
        const body: PageFollowStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as PageFollowStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/page-follows/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async getPageByLink(link: string): Promise<PageResource | null> {
        const res = await api.GET('/api/pages', {
            params: {
                query: {
                    filter: { link, title: null, userId: null },
                    limit: 1,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data?.[0] ?? null;
    },

    async followPage(
        pageId: string,
        bodyOrStatus: PageFollowStatusDto | PageFollowStatusEnum,
    ): Promise<CreatePageFollowResponse> {
        return await pageService.createPageFollow(pageId, bodyOrStatus);
    },

    async unfollowPage(followId: string): Promise<DeletePageFollowResponse> {
        return await pageService.deletePageFollow(followId);
    },

    async getPageFollows(pageId: string, userId: string): Promise<GetPageFollowsResponse> {
        const filter: PageFollowFilterDto = { pageIds: [pageId], userId };
        const res = await api.GET('/api/page-follows', {
            params: {
                query: {
                    filter,
                    limit: 50,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
