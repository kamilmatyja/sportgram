import {FeedCommentResponse} from './FeedCommentResponse';
import {FeedReactionResponse} from './FeedReactionResponse';

export interface FeedResponse {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    text: string;
    photo: string;
    status: number;
    comments?: FeedCommentResponse[];
    reactions?: FeedReactionResponse[];
}