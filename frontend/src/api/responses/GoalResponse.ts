import {GoalParticipantResponse} from './GoalParticipantResponse';

export class GoalResponse {
    id!: string;
    userId!: string;
    feedId!: string;
    createdAt!: string;
    updatedAt!: string;
    startedAt!: string | null;
    endedAt!: string | null;
    text!: string;
    link!: string;
    discipline!: number;
    distance!: number;
    time!: number | null;
    status!: number;
    participants!: GoalParticipantResponse[];
}