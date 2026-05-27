import {TrainingDisciplineDistanceResponse} from './TrainingDisciplineDistanceResponse';

export class TrainingDisciplineResponse {
    id!: string;
    trainingParticipantId!: string;
    discipline!: number;
    distances!: TrainingDisciplineDistanceResponse[];
}