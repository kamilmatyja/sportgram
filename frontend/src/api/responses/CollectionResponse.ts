import { PaginationResponse } from './PaginationResponse';

export class CollectionResponse<T> {
    data!: T[];
    pagination!: PaginationResponse;
}
