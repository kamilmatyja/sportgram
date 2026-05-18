import {UserRoleResponse} from './UserRoleResponse';

export interface UserResponse {
    id: string;
    firstName: string;
    lastName: string;
    link: string;
    email: string;
    phone: string;
    birthAt: string;
    gender: number;
    country: number;
    bio: string;
    status: number;
    createdAt: string;
    profilePhoto: string;
    backgroundPhoto: string;
    roles?: UserRoleResponse[];
}

