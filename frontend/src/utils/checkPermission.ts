import {useAuth} from '../context/AuthContext';
import {UserProvider} from '../api/providers/UserProvider';
import type {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {RoleEnum} from '../enums/RoleEnum';
import {UserResponse} from '../api/responses/UserResponse';

export function useCheckPermission() {
    const {signId} = useAuth();
    const userProvider = new UserProvider();

    const check = async (role: RoleEnum): Promise<boolean> => {
        if (!signId) return false;
        const filter = {signId};
        const indexDto: UserIndexQuery = {page: 1, limit: 1, sort: 'createdAt:desc', filter};
        const currentUserArr = await userProvider.index(indexDto);
        if (currentUserArr.length === 0) return false;
        const myId = currentUserArr[0].id;
        const details = await userProvider.details(myId, ['userRoles']);
        return details.roles?.some((r: any) => r.role === role) ?? false;
    };

    const getCurrentUser = async (): Promise<UserResponse | null> => {
        if (!signId) return null;
        const filter = {signId};
        const indexDto: UserIndexQuery = {page: 1, limit: 1, sort: 'createdAt:desc', filter};
        const currentUserArr = await userProvider.index(indexDto);
        const currentUser = currentUserArr[0];
        return await userProvider.details(currentUser.id, ['userRoles', 'userDisciplines']);
    }

    return {check, getCurrentUser};
}
