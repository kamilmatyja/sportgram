export class UserIndexDto {
    constructor(page = 1, limit = 10, sort = 'createdAt:desc', filter = null) {
        this.page = page;
        this.limit = limit;
        this.sort = sort;
        this.filter = filter;
    }
}