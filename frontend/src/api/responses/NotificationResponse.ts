export class NotificationResponse {
    id!: string;
    userId!: string;
    createdAt!: string;
    updatedAt!: string;
    text!: string;
    link!: string | null;
    status!: number;
}