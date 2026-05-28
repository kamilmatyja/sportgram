import {TrainingDisciplineDistanceResponse} from './TrainingDisciplineDistanceResponse';

export class TrainingDisciplineResponse {
    id!: string;
    trainingId!: string;
    createdAt!: string;
    updatedAt!: string;
    discipline!: number;
    distances!: TrainingDisciplineDistanceResponse[];
}