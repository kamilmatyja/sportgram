export interface FeedReactionResponse {
    id: string;
    feedId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    reaction: number;
    status: number;
}