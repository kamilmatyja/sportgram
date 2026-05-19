import {TrainingDisciplineDistanceResponse} from './TrainingDisciplineDistanceResponse';

export interface TrainingDisciplineResponse {
    id: string;
    trainingParticipantId: string;
    discipline: number;
    distances?: TrainingDisciplineDistanceResponse[];
}