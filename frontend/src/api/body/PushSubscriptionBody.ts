export class PushSubscriptionBody {
    public status: number;

    constructor(
        public endpoint: string,
        public p256dh: string,
        public auth: string,
        public userAgent: string | null,
        status: string | number
    ) {
        this.status = typeof status === 'string' ? parseInt(status, 10) : status;
    }
}