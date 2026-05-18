import {useAuth} from '../context/AuthContext';
import {UserService} from '../api/service/UserService';
import {UserFilterDto} from '../api/dto/UserFilterDto';
import {UserIndexDto} from '../api/dto/UserIndexDto';
import {RoleEnum} from '../enums/RoleEnum';

export function useCheckPermission() {
    const {signId} = useAuth();
    const userService = new UserService();

    const check = async (role: RoleEnum): Promise<boolean> => {
        if (!signId) return false;
        const filter = new UserFilterDto();
        filter.signId = signId;
        const indexDto = new UserIndexDto(1, 1, 'createdAt:desc', filter);
        const currentUserArr = await userService.index(indexDto);
        if (currentUserArr.length === 0) return false;
        const myId = currentUserArr[0].id;
        const details = await userService.details(myId, ['userRoles']);
        return details.roles?.some((r: any) => r.role === role) ?? false;
    };

    return {check};
}
