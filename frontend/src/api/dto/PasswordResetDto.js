export class PasswordResetDto {
    constructor(code, password) {
        this.code = parseInt(code, 10);
        this.password = password;
    }
}