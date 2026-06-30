export class FeedReactionBody {
    public type: number;

    constructor(type: string | number) {
        this.type = typeof type === 'string' ? parseInt(type, 10) : type;
    }
}
