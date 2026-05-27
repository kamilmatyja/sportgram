import {TrainingDisciplineSubDistanceResponse} from './TrainingDisciplineSubDistanceResponse';

export class TrainingDisciplineDistanceResponse {
    id!: string;
    trainingDisciplineId!: string;
    distance!: number;
    time!: number;
    subDistances!: TrainingDisciplineSubDistanceResponse[];
}