import {TrainingDiscipline} from './TrainingDiscipline';

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