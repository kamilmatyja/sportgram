export class PasswordResetDto {
    public code: number;

    constructor(
        code: string | number,
        public password: string
    ) {
        this.code = typeof code === 'string' ? parseInt(code, 10) : code;
    }
}