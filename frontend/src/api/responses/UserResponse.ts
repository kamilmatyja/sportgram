import { UserDisciplineResponse } from './UserDisciplineResponse';
import { UserRoleResponse } from './UserRoleResponse';

export class UserResponse {
    id!: string;
    createdAt!: string;
    updatedAt!: string;
    birthAt!: string;
    firstName!: string;
    lastName!: string;
    gender!: number;
    phone!: number;
    email!: string;
    link!: string;
    language!: number;
    country!: number;
    theme!: number;
    color!: number;
    profilePhoto!: string;
    backgroundPhoto!: string;
    bio!: string;
    status!: number;
    roles!: UserRoleResponse[];
    disciplines!: UserDisciplineResponse[];
}
