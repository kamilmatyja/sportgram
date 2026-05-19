import {TrainingDisciplineResponse} from './TrainingDisciplineResponse';
import {TrainingParticipantResponse} from './TrainingParticipantResponse';

export interface TrainingResponse {
    id: string;
    feedId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    startedAt: string;
    endedAt: string;
    title: string;
    description: string;
    link: string;
    location: string;
    status: number;
    disciplines?: TrainingDisciplineResponse[];
    participants?: TrainingParticipantResponse[];
}