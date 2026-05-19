import {UserRoleResponse} from './UserRoleResponse';
import {UserDisciplineResponse} from "./UserDisciplineResponse.ts";

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
    color: number;
    bio: string;
    status: number;
    createdAt: string;
    profilePhoto: string;
    backgroundPhoto: string;
    roles?: UserRoleResponse[];
    disciplines?: UserDisciplineResponse[];
}

