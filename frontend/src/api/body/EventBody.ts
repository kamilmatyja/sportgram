import {EventDiscipline} from './EventDiscipline';

export class EventBody {
    constructor(
        public startedAt: string,
        public endedAt: string,
        public title: string,
        public description: string,
        public link: string,
        public rules: string,
        public photo: string,
        public location: string,
        public disciplines: EventDiscipline[] = []
    ) {
    }
}