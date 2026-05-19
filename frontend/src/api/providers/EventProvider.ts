import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {EventResponse} from '../responses/EventResponse';
import {EventDisciplineDistanceListResponse} from '../responses/EventDisciplineDistanceListResponse';
import {EventBody} from '../body/EventBody';
import {EventResultBody} from '../body/EventResultBody';
import {StatusBody} from '../body/StatusBody';

export class EventProvider {
    async create(pageId: string, dto: EventBody): Promise<IdResponse> {
        return await apiFetch(`/api/event-pages/${pageId}`, {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: EventBody): Promise<IdResponse> {
        return await apiFetch(`/api/events/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/events/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/events/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<EventResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/events?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<EventResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/events/${id}${query}`, {method: 'GET'});
    }

    async createList(distanceId: string): Promise<IdResponse> {
        return await apiFetch(`/api/event-discipline-distances/${distanceId}`, {method: 'POST'});
    }

    async updateListStatus(listId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/event-discipline-distance-lists/${listId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async deleteList(listId: string): Promise<IdResponse> {
        return await apiFetch(`/api/event-discipline-distance-lists/${listId}`, {method: 'DELETE'});
    }

    async indexList(distanceId: string, page: number, limit: number, sort: string, filter: any = {}): Promise<EventDisciplineDistanceListResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/event-discipline-distances/${distanceId}?${params.toString()}`, {method: 'GET'});
    }

    async detailsList(listId: string, include: string[] = []): Promise<EventDisciplineDistanceListResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/event-discipline-distance-lists/${listId}${query}`, {method: 'GET'});
    }

    async createResult(listId: string, dto: EventResultBody): Promise<IdResponse> {
        return await apiFetch(`/api/event-discipline-distance-lists/${listId}`, {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async updateResult(resultId: string, dto: EventResultBody): Promise<IdResponse> {
        return await apiFetch(`/api/event-discipline-distance-results/${resultId}`, {
            method: 'PUT',
            body: JSON.stringify(dto)
        });
    }

    async deleteResult(resultId: string): Promise<IdResponse> {
        return await apiFetch(`/api/event-discipline-distance-results/${resultId}`, {method: 'DELETE'});
    }
}