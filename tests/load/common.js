import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'http://nginx';
const token = __ENV.LOAD_TEST_TOKEN;

if (!/^http:\/\/(nginx|localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(baseUrl)) {
    throw new Error('BASE_URL must point to the local Docker nginx service or loopback.');
}

if (!token) {
    throw new Error('Set LOAD_TEST_TOKEN to a valid participant JWT.');
}

export const url = baseUrl;
export const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
};

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        checks: ['rate>0.95'],
        http_req_failed: ['rate<0.05'],
        http_req_waiting: ['p(95)<6500', 'p(99)<7500'],
        http_req_duration: ['avg<2500', 'p(95)<6500', 'p(99)<7500'],
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

const ttfb = new Trend('api_ttfb', true);
const responseTime = new Trend('api_response_time', true);

export function recordResponse(response, endpoint, expectedStatus) {
    check(response, {
        [`${endpoint} returns ${expectedStatus}`]: (result) => result.status === expectedStatus,
    });
    ttfb.add(response.timings.waiting, { endpoint });
    responseTime.add(response.timings.duration, { endpoint });
}

export { sleep };
