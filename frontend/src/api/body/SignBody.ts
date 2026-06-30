export class SignBody {
    public rememberMe: boolean;

    constructor(
        public email: string,
        public password: string,
        rememberMe: boolean | string | number,
    ) {
        this.rememberMe = Boolean(rememberMe);
    }
}
