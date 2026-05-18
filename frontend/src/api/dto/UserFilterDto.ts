export class UserFilterDto {
    public firstName?: string;
    public lastName?: string;
    public gender?: number;
    public email?: string;
    public country?: number;
    public status?: number;
    public userIds?: string[];
    public link?: string;

    constructor(
        firstName: string | null = null,
        lastName: string | null = null,
        gender: string | number | null = null,
        email: string | null = null,
        country: string | number | null = null,
        status: string | number | null = null,
        userIds: string[] | null = null,
        link: string | null = null
    ) {
        if (firstName) this.firstName = firstName;
        if (lastName) this.lastName = lastName;
        if (gender) this.gender = typeof gender === 'string' ? parseInt(gender, 10) : gender;
        if (email) this.email = email;
        if (country) this.country = typeof country === 'string' ? parseInt(country, 10) : country;
        if (status) this.status = typeof status === 'string' ? parseInt(status, 10) : status;
        if (userIds) this.userIds = userIds;
        if (link) this.link = link;
    }
}