import { GoalParticipantResultResponse } from './GoalParticipantResultResponse';

export class GoalParticipantResponse {
    id!: string;
    goalId!: string;
    userId!: string;
    createdAt!: string;
    updatedAt!: string;
    status!: number;
    results!: GoalParticipantResultResponse[];
}
