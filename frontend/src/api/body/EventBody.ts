export interface EventSubDistance {
    subDistance: number;
}

export interface EventDistance {
    distance: number;
    subDistances?: EventSubDistance[];
}

export interface EventDiscipline {
    discipline: number;
    distances?: EventDistance[];
}

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