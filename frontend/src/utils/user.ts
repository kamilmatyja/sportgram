import { type UserResponse } from '../api/responses/UserResponse';
import { type SelectOption } from '../components/Common/SelectOptions';

export const formatUserName = (user: Pick<UserResponse, 'firstName' | 'lastName'>): string =>
    `${user.firstName} ${user.lastName}`;

export const toUserOptions = (users: UserResponse[]): SelectOption[] =>
    users.map((user) => ({ value: user.id, label: `${formatUserName(user)} (${user.link})` }));
