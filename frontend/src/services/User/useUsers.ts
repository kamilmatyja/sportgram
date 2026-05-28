import {useEffect, useState} from 'react';
import {UserProvider} from '../../api/providers/UserProvider';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserResponse} from '../../api/responses/UserResponse';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUsers() {
    const access = useAppAccess();
    const userProvider = new UserProvider();

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(false);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new UserFilterQuery());

    const fetchUsers = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new UserFilterQuery();
            filterDto.firstName = list.filters.firstName;
            filterDto.lastName = list.filters.lastName;
            filterDto.gender = list.filters.gender ? Number(list.filters.gender) : undefined;
            filterDto.email = list.filters.email;
            filterDto.country = list.filters.country ? Number(list.filters.country) : undefined;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;
            filterDto.link = list.filters.link;

            const indexDto = new UserIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await userProvider.index(indexDto);
            setUsers(data);
        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchUsers();
        }
    }, [access.authLoading, access.authError, list.page, list.limit, list.sort, list.filters]);

    return {
        ...access,
        ...list,
        users,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        fetchUsers
    };
}