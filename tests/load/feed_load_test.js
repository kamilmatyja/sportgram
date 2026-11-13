import http from 'k6/http';
import { headers, options, recordResponse, sleep, url } from './common.js';

export { options };

export default function () {
    const params = { headers, redirects: 0, tags: { endpoint: 'feeds' } };
    const listResponse = http.get(`${url}/api/feeds?page=1&limit=10`, params);
    recordResponse(listResponse, 'feeds GET', 200);

    const payload = {
        text: `k6 load test post from VU ${__VU}, iteration ${__ITER}`,
        photo: 'azYg',
    };
    const createResponse = http.post(`${url}/api/feeds`, JSON.stringify(payload), params);
    recordResponse(createResponse, 'feeds POST', 201);

    sleep(1);
}
