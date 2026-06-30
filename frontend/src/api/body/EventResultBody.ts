import { EventSubResult } from './EventSubResult';

export class EventResultBody {
    public time: number;

    constructor(
        time: string | number,
        public subResults: EventSubResult[] = [],
    ) {
        this.time = typeof time === 'string' ? parseInt(time, 10) : time;
    }
}
