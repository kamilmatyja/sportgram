export class StatusBody {
    public status: number;

    constructor(status: string | number) {
        this.status = typeof status === 'string' ? parseInt(status, 10) : status;
    }
}