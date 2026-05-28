import {useEffect} from 'react';
import {UserProvider} from '../../api/providers/UserProvider';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserResponse} from '../../api/responses/UserResponse';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {useListFilters} from '../../utils/hooks/useListFilters';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function useUsers() {
    const access = useAppAccess();
    const userProvider = new UserProvider();
    const list = useListFilters(new UserFilterQuery());
    const { data, loading, error, executeFetch } = useDataFetch<UserResponse[]>();

    const fetchUsers = () => {
        executeFetch(async () => {
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

            return await userProvider.index(indexDto);
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchUsers();
        }
    }, [access.authLoading, access.authError, list.page, list.limit, list.sort, list.filters]);

    return {
        ...access,
        ...list,
        users: data || [],
        loading: access.authLoading || loading,
        error: access.authError || error,
        fetchUsers
    };
}