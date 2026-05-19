import {useAuth} from '../context/AuthContext';
import {UserProvider} from '../api/providers/UserProvider';
import {UserFilterQuery} from '../api/queries/UserFilterQuery.ts';
import {UserIndexQuery} from '../api/queries/UserIndexQuery.ts';
import {RoleEnum} from '../enums/RoleEnum';
import {UserResponse} from "../api/responses/UserResponse.ts";

export function useCheckPermission() {
    const {signId} = useAuth();
    const userProvider = new UserProvider();

    const check = async (role: RoleEnum): Promise<boolean> => {
        if (!signId) return false;
        const filter = new UserFilterQuery();
        filter.signId = signId;
        const indexDto = new UserIndexQuery(1, 1, 'createdAt:desc', filter);
        const currentUserArr = await userProvider.index(indexDto);
        if (currentUserArr.length === 0) return false;
        const myId = currentUserArr[0].id;
        const details = await userProvider.details(myId, ['userRoles']);
        return details.roles?.some((r: any) => r.role === role) ?? false;
    };

    const getCurrentUser = async (): Promise<UserResponse|null> => {
        if (!signId) return null;
        const filter = new UserFilterQuery();
        filter.signId = signId;
        const indexDto = new UserIndexQuery(1, 1, 'createdAt:desc', filter);
        const currentUserArr = await userProvider.index(indexDto);
        const currentUser = currentUserArr[0];
        return await userProvider.details(currentUser.id, ['userRoles', 'userDisciplines']);
    }

    return {check, getCurrentUser};
}
