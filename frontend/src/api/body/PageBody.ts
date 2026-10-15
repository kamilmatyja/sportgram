export class PageBody {
    public color: number;

    constructor(
        public title: string,
        public description: string,
        public link: string,
        public profilePhoto: string,
        public backgroundPhoto: string,
        color: string | number,
        public userIds: string[] = [],
    ) {
        this.color = typeof color === 'string' ? parseInt(color, 10) : color;
    }
}
