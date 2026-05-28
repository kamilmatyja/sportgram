import {TrainingDisciplineSubDistanceResponse} from './TrainingDisciplineSubDistanceResponse';

export class TrainingDisciplineDistanceResponse {
    id!: string;
    trainingDisciplineId!: string;
    createdAt!: string;
    updatedAt!: string;
    distance!: number;
    time!: number;
    subDistances!: TrainingDisciplineSubDistanceResponse[];
}