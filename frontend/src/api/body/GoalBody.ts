export class GoalBody {
    public discipline: number;
    public distance: number;
    public time: number | null;

    constructor(
        public startedAt: string,
        public endedAt: string,
        public text: string,
        public link: string,
        discipline: string | number,
        distance: string | number,
        time: string | number | null,
        public participants: string[] = []
    ) {
        this.discipline = typeof discipline === 'string' ? parseInt(discipline, 10) : discipline;
        this.distance = typeof distance === 'string' ? parseInt(distance, 10) : distance;
        this.time = time ? (typeof time === 'string' ? parseInt(time, 10) : time) : null;
    }
}