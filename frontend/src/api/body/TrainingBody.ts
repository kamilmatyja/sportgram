export interface TrainingSubDistance {
    subDistance: number;
    time: number;
    lat?: number | null;
    lng?: number | null;
    accuracy?: number | null;
    speed?: number | null;
}

export interface TrainingDistance {
    distance: number;
    time: number;
    subDistances?: TrainingSubDistance[];
}

export interface TrainingDiscipline {
    discipline: number;
    distances?: TrainingDistance[];
}

export class TrainingBody {
    constructor(
        public startedAt: string,
        public endedAt: string,
        public title: string,
        public description: string,
        public link: string,
        public location: string,
        public disciplines: TrainingDiscipline[] = [],
        public participants: string[] = []
    ) {
    }
}