export class UserFilterDto {
    constructor(firstName = null, lastName = null, gender = null, email = null, country = null, status = null, userIds = null, link = null) {
        if (firstName) this.firstName = firstName;
        if (lastName) this.lastName = lastName;
        if (gender) this.gender = gender;
        if (email) this.email = email;
        if (country) this.country = country;
        if (status) this.status = status;
        if (userIds) this.userIds = userIds;
        if (link) this.link = link;
    }
}