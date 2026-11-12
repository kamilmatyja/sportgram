import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type EventResource = components['schemas']['EventResource'];
export type EventDto = components['schemas']['EventDto'];
export type EventFilterDto = components['schemas']['EventFilterDto'];
export type EventDisciplineResource = components['schemas']['EventDisciplineResource'];
export type EventDisciplineDistanceResource = components['schemas']['EventDisciplineDistanceResource'];
export type EventDisciplineSubDistanceResource = components['schemas']['EventDisciplineSubDistanceResource'];
export type EventDisciplineDistanceListResource = components['schemas']['EventDisciplineDistanceListResource'];
export type EventDisciplineDistanceResultResource = components['schemas']['EventDisciplineDistanceResultResource'];

export type GetEventsQuery = operations['get_event_index']['parameters']['query'];
export type GetEventDetailsQuery = operations['get_event_details']['parameters']['query'];
export type GetEventDisciplineDistancesQuery =
    operations['get_event_discipline_distance_list_index']['parameters']['query'];

export const eventService = {
    async createEvent(req: ApiRequest<'post_event_create'>): Promise<ApiResponse<'post_event_create'>> {
        const res = await api.POST('/api/event-pages/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getEvent(req: ApiRequest<'get_event_details'>): Promise<ApiResponse<'get_event_details'>> {
        const res = await api.GET('/api/events/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updateEvent(req: ApiRequest<'put_event_update'>): Promise<ApiResponse<'put_event_update'>> {
        const res = await api.PUT('/api/events/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async deleteEvent(req: ApiRequest<'delete_event_delete'>): Promise<ApiResponse<'delete_event_delete'>> {
        const res = await api.DELETE('/api/events/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updateEventStatus(
        req: ApiRequest<'patch_event_update_status'>,
    ): Promise<ApiResponse<'patch_event_update_status'>> {
        const res = await api.PATCH('/api/events/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getEvents(req: ApiRequest<'get_event_index'>): Promise<ApiResponse<'get_event_index'>> {
        const res = await api.GET('/api/events', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async createEventDisciplineDistanceList(
        req: ApiRequest<'post_event_discipline_distance_list_create'>,
    ): Promise<ApiResponse<'post_event_discipline_distance_list_create'>> {
        const res = await api.POST('/api/event-discipline-distances/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updateEventDisciplineDistanceListStatus(
        req: ApiRequest<'patch_event_discipline_distance_list_update_status'>,
    ): Promise<ApiResponse<'patch_event_discipline_distance_list_update_status'>> {
        const res = await api.PATCH('/api/event-discipline-distance-lists/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getEventDisciplineDistanceList(
        req: ApiRequest<'get_event_discipline_distance_list_details'>,
    ): Promise<ApiResponse<'get_event_discipline_distance_list_details'>> {
        const res = await api.GET('/api/event-discipline-distance-lists/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async createEventDisciplineDistanceResult(
        req: ApiRequest<'post_event_discipline_distance_result_create'>,
    ): Promise<ApiResponse<'post_event_discipline_distance_result_create'>> {
        const res = await api.POST('/api/event-discipline-distance-lists/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async deleteEventDisciplineDistanceList(
        req: ApiRequest<'delete_event_discipline_distance_list_delete'>,
    ): Promise<ApiResponse<'delete_event_discipline_distance_list_delete'>> {
        const res = await api.DELETE('/api/event-discipline-distance-lists/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getEventDisciplineDistanceLists(
        req: ApiRequest<'get_event_discipline_distance_list_index'>,
    ): Promise<ApiResponse<'get_event_discipline_distance_list_index'>> {
        const res = await api.GET('/api/event-discipline-distance-lists', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updateEventDisciplineDistanceResult(
        req: ApiRequest<'put_event_discipline_distance_result_update'>,
    ): Promise<ApiResponse<'put_event_discipline_distance_result_update'>> {
        const res = await api.PUT('/api/event-discipline-distance-results/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async deleteEventDisciplineDistanceResult(
        req: ApiRequest<'delete_event_discipline_distance_result_delete'>,
    ): Promise<ApiResponse<'delete_event_discipline_distance_result_delete'>> {
        const res = await api.DELETE('/api/event-discipline-distance-results/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
};
