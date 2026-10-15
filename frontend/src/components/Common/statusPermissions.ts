import { type UserResponse } from '../../api/responses/UserResponse';

export const canChangeOwnStatus =
    (currentUser: UserResponse | null) =>
    (entry: { userId: string }): boolean =>
        !!currentUser && entry.userId === currentUser.id;
