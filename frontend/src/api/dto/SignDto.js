export class SignDto {
    constructor(email, password, rememberMe) {
        this.email = email;
        this.password = password;
        this.rememberMe = Boolean(rememberMe);
    }
}