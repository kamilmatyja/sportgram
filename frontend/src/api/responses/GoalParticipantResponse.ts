import {GoalParticipantResultResponse} from './GoalParticipantResultResponse';

export interface GoalParticipantResponse {
    id: string;
    goalId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    status: number;
    results?: GoalParticipantResultResponse[];
}