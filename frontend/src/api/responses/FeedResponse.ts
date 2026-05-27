import {FeedCommentResponse} from './FeedCommentResponse';
import {FeedReactionResponse} from './FeedReactionResponse';
import {EventDisciplineDistanceListResponse} from './EventDisciplineDistanceListResponse';
import {EventDisciplineDistanceResultResponse} from './EventDisciplineDistanceResultResponse';
import {GoalResponse} from './GoalResponse';
import {GoalParticipantResultResponse} from './GoalParticipantResultResponse';
import {TrainingResponse} from './TrainingResponse';

export class FeedResponse {
    id!: string;
    userId!: string;
    createdAt!: string;
    updatedAt!: string;
    text!: string;
    photo!: string;
    status!: number;
    comments!: FeedCommentResponse[];
    reactions!: FeedReactionResponse[];
    eventDisciplineList: EventDisciplineDistanceListResponse | null = null;
    eventDisciplineResult: EventDisciplineDistanceResultResponse | null = null;
    goal: GoalResponse | null = null;
    goalParticipantResult: GoalParticipantResultResponse | null = null;
    training: TrainingResponse | null = null;
}