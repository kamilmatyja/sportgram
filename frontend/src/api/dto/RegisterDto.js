export class RegisterDto {
    constructor(birthAt, firstName, lastName, gender, phone, email, password, country, roles) {
        this.birthAt = birthAt;
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = parseInt(gender, 10);
        this.phone = parseInt(phone, 10);
        this.email = email;
        this.password = password;
        this.country = parseInt(country, 10);
        this.roles = Array.isArray(roles) ? roles.map(r => parseInt(r, 10)) : [];
    }
}
