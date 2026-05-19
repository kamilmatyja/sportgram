export class CodeBody {
    public code: number;

    constructor(code: string | number) {
        this.code = typeof code === 'string' ? parseInt(code, 10) : code;
    }
}