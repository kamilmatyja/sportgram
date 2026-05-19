import {GoalParticipantResponse} from './GoalParticipantResponse';

export class GoalResponse {
    id!: string;
    createdAt!: string;
    updatedAt!: string;
    text!: string;
    discipline!: number;
    distance!: number;
    time!: number | null;
    status!: number;
    participants!: GoalParticipantResponse[];
}