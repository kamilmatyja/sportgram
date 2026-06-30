export class EntryBody {
    public type: number;

    constructor(
        public entityId: string,
        type: string | number,
    ) {
        this.type = typeof type === 'string' ? parseInt(type, 10) : type;
    }
}
