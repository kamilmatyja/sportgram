export interface ConversationResponse {
    id: string;
    senderUserId: string;
    receiverUserId: string;
    createdAt: string;
    updatedAt: string;
    text: string;
    status: number;
}