import http from 'k6/http';
import { headers, options, recordResponse, sleep, url } from './common.js';

export { options };

export default function () {
    const params = { headers, redirects: 0, tags: { endpoint: 'trainings' } };
    const listResponse = http.get(`${url}/api/trainings?page=1&limit=10`, params);
    recordResponse(listResponse, 'trainings GET', 200);

    const now = new Date();
    const startedAt = now.toISOString().slice(0, 16);
    const endedAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
    const payload = {
        startedAt,
        endedAt,
        title: 'k6 load test training',
        description: 'Training created by the local k6 load test.',
        link: `load-${__VU}-${__ITER}-${Date.now()}`,
        location: 'Load test',
        disciplines: [],
        userIds: [],
    };
    const createResponse = http.post(`${url}/api/trainings`, JSON.stringify(payload), params);
    recordResponse(createResponse, 'trainings POST', 201);

    sleep(1);
}
