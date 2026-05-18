export class RegisterDto {
    public gender: number;
    public phone: number;
    public country: number;
    public roles: number[];

    constructor(
        public birthAt: string,
        public firstName: string,
        public lastName: string,
        gender: string | number,
        phone: string | number,
        public email: string,
        public password: string,
        country: string | number,
        roles: (string | number)[]
    ) {
        this.gender = typeof gender === 'string' ? parseInt(gender, 10) : gender;
        this.phone = typeof phone === 'string' ? parseInt(phone, 10) : phone;
        this.country = typeof country === 'string' ? parseInt(country, 10) : country;

        this.roles = Array.isArray(roles)
            ? roles.map(r => (typeof r === 'string' ? parseInt(r, 10) : r))
            : [];
    }
}