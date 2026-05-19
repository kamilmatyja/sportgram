import {TrainingDisciplineSubDistanceResponse} from './TrainingDisciplineSubDistanceResponse';

export interface TrainingDisciplineDistanceResponse {
    id: string;
    trainingDisciplineId: string;
    distance: number;
    time: number;
    subDistances?: TrainingDisciplineSubDistanceResponse[];
}