export class UserUpdateBody {
    constructor(
        public birthAt: string,
        public firstName: string,
        public lastName: string,
        public gender: number,
        public phone: number,
        public email: string,
        public link: string,
        public language: number,
        public country: number,
        public theme: number,
        public color: number,
        public profilePhoto: string,
        public backgroundPhoto: string,
        public bio: string,
        public roles: number[],
        public password?: string | null,
        public disciplines: number[] = [],
    ) {}
}
