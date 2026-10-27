import { api } from '../client';
import type { components, operations } from '../schema';
import type { ElementStatusDto } from './common.types';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

export type EventResource = components['schemas']['EventResource'];
export type EventDto = components['schemas']['EventDto'];
export type EventFilterDto = components['schemas']['EventFilterDto'];
export type EventDisciplineDistanceDto = components['schemas']['EventDisciplineDistanceDto'];
export type EventDisciplineDistanceResource = components['schemas']['EventDisciplineDistanceResource'];
export type EventDisciplineDistanceListResource = components['schemas']['EventDisciplineDistanceListResource'];
export type EventDisciplineDistanceResultResource = components['schemas']['EventDisciplineDistanceResultResource'];
export type EventResultDto = components['schemas']['EventResultDto'];
export type EventSubResultDto = components['schemas']['EventSubResultDto'];

export type GetEventsQuery = operations['get_event_index']['parameters']['query'];
export type GetEventDetailsQuery = operations['get_event_details']['parameters']['query'];
export type GetEventDisciplineDistancesQuery =
    operations['get_event_discipline_distance_list_index']['parameters']['query'];
export type GetEventDisciplineDistanceListDetailsQuery =
    operations['get_event_discipline_distance_list_details']['parameters']['query'];

export type GetEventsResponse = operations['get_event_index']['responses'][200]['content']['application/json'];
export type GetEventResponse = operations['get_event_details']['responses'][200]['content']['application/json'];
export type UpdateEventResponse = operations['put_event_update']['responses'][200]['content']['application/json'];
export type DeleteEventResponse = operations['delete_event_delete']['responses'][200]['content']['application/json'];
export type UpdateEventStatusResponse =
    operations['patch_event_update_status']['responses'][200]['content']['application/json'];
export type CreateEventResponse = operations['post_event_create']['responses'][201]['content']['application/json'];
export type GetEventDisciplineDistancesResponse =
    operations['get_event_discipline_distance_list_index']['responses'][200]['content']['application/json'];
export type CreateEventDisciplineDistanceResponse =
    operations['post_event_discipline_distance_list_create']['responses'][201]['content']['application/json'];
export type GetEventDisciplineDistanceListResponse =
    operations['get_event_discipline_distance_list_details']['responses'][200]['content']['application/json'];
export type DeleteEventDisciplineDistanceListResponse =
    operations['delete_event_discipline_distance_list_delete']['responses'][200]['content']['application/json'];
export type UpdateEventDisciplineDistanceListStatusResponse =
    operations['patch_event_discipline_distance_list_update_status']['responses'][200]['content']['application/json'];
export type CreateEventDisciplineDistanceResultResponse =
    operations['post_event_discipline_distance_result_create']['responses'][201]['content']['application/json'];
export type UpdateEventDisciplineDistanceResultResponse =
    operations['put_event_discipline_distance_result_update']['responses'][200]['content']['application/json'];
export type DeleteEventDisciplineDistanceResultResponse =
    operations['delete_event_discipline_distance_result_delete']['responses'][200]['content']['application/json'];

export const eventService = {
    async getEvents(query?: GetEventsQuery): Promise<GetEventsResponse> {
        const res = await api.GET('/api/events', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getEvent(id: string, query?: GetEventDetailsQuery): Promise<GetEventResponse> {
        const res = await api.GET('/api/events/{id}', {
            params: { path: { id }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateEvent(id: string, body: EventDto): Promise<UpdateEventResponse> {
        const res = await api.PUT('/api/events/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteEvent(id: string): Promise<DeleteEventResponse> {
        const res = await api.DELETE('/api/events/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateEventStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateEventStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/events/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createEvent(pageId: string, body: EventDto): Promise<CreateEventResponse> {
        const res = await api.POST('/api/event-pages/{id}', {
            params: { path: { id: pageId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getEventDisciplineDistances(
        eventId: string,
        query?: GetEventDisciplineDistancesQuery,
    ): Promise<GetEventDisciplineDistancesResponse> {
        const res = await api.GET('/api/event-discipline-distances/{id}', {
            params: { path: { id: eventId }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createEventDisciplineDistance(eventId: string): Promise<CreateEventDisciplineDistanceResponse> {
        const res = await api.POST('/api/event-discipline-distances/{id}', {
            params: { path: { id: eventId } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getEventDisciplineDistanceList(
        distanceId: string,
        query?: GetEventDisciplineDistanceListDetailsQuery,
    ): Promise<GetEventDisciplineDistanceListResponse> {
        const res = await api.GET('/api/event-discipline-distance-lists/{id}', {
            params: { path: { id: distanceId }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteEventDisciplineDistanceList(distanceId: string): Promise<DeleteEventDisciplineDistanceListResponse> {
        const res = await api.DELETE('/api/event-discipline-distance-lists/{id}', {
            params: { path: { id: distanceId } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateEventDisciplineDistanceListStatus(
        distanceId: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateEventDisciplineDistanceListStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/event-discipline-distance-lists/{id}/status', {
            params: { path: { id: distanceId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createEventDisciplineDistanceResult(
        distanceId: string,
        body: EventResultDto,
    ): Promise<CreateEventDisciplineDistanceResultResponse> {
        const res = await api.POST('/api/event-discipline-distance-lists/{id}', {
            params: { path: { id: distanceId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateEventDisciplineDistanceResult(
        resultId: string,
        body: EventResultDto,
    ): Promise<UpdateEventDisciplineDistanceResultResponse> {
        const res = await api.PUT('/api/event-discipline-distance-results/{id}', {
            params: { path: { id: resultId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteEventDisciplineDistanceResult(resultId: string): Promise<DeleteEventDisciplineDistanceResultResponse> {
        const res = await api.DELETE('/api/event-discipline-distance-results/{id}', {
            params: { path: { id: resultId } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async getEventByLink(link: string): Promise<EventResource | null> {
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

    async signUpForDistance(distanceId: string): Promise<CreateEventDisciplineDistanceResponse> {
        return await eventService.createEventDisciplineDistance(distanceId);
    },
};
