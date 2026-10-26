import { api } from '../client';
import type { components } from '../schema';

export type PageResource = components['schemas']['PageResource'];
export type PageDto = components['schemas']['PageDto'];
export type PageFollowResource = components['schemas']['PageFollowResource'];

export interface GetPagesParams {
    page?: number;
    limit?: number;
    filter?: {
        userId?: string | null;
        title?: string | null;
        link?: string | null;
    };
    sort?: string;
}

export const pageService = {
    async getPages(params?: GetPagesParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            sort: params?.sort ?? 'createdAt:desc',
        };
        if (params?.filter) query.filter = params.filter;

        const res = await api.GET('/api/pages', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getPageByLink(link: string) {
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

    async createPage(body: PageDto) {
        const res = await api.POST('/api/pages', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async updatePage(id: string, body: PageDto) {
        const res = await api.PUT('/api/pages/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deletePage(id: string) {
        const res = await api.DELETE('/api/pages/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async followPage(pageId: string) {
        const res = await api.POST('/api/pages/{id}/follows', {
            params: { path: { id: pageId } },
            body: { status: 2 },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async unfollowPage(followId: string) {
        const res = await api.DELETE('/api/page-follows/{id}', {
            params: { path: { id: followId } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getPageFollows(pageId: string, userId?: string) {
        const res = await api.GET('/api/page-follows', {
            params: {
                query: {
                    filter: { pageId, userId: userId || null },
                    limit: 50,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
