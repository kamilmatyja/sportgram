import { api } from '../client';
import type { components } from '../schema';

export type EventResource = components['schemas']['EventResource'];
export type EventDto = components['schemas']['EventDto'];

export interface GetEventsParams {
    page?: number;
    limit?: number;
    filter?: {
        userId?: string | null;
        title?: string | null;
        link?: string | null;
    };
    sort?: string;
}

export const eventService = {
    async getEvents(params?: GetEventsParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            sort: params?.sort ?? 'startedAt:desc',
        };
        if (params?.filter) query.filter = params.filter;

        const res = await api.GET('/api/events', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getEventByLink(link: string) {
        const res = await api.GET('/api/events', {
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

    async createEvent(pageId: string, body: EventDto) {
        const res = await api.POST('/api/event-pages/{id}', {
            params: { path: { id: pageId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteEvent(id: string) {
        const res = await api.DELETE('/api/events/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async signUpForDistance(distanceId: string, time: number = 0) {
        const res = await api.POST('/api/event-discipline-distance-lists/{id}', {
            params: { path: { id: distanceId } },
            body: { time, subResults: null },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
