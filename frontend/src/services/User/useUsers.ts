import { UserProvider } from '../../api/providers/UserProvider';
import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { UserIndexQuery } from '../../api/queries/UserIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { toOptionalNumber } from '../../utils/query';

export function useUsers() {
    const access = useAppAccess();
    const userProvider = new UserProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new UserFilterQuery(),
        scope: isAccessReady(access) ? access.currentUser : null,
        fetchPage: async (list) => {
            const filterDto = new UserFilterQuery();
            filterDto.firstName = list.filters.firstName;
            filterDto.lastName = list.filters.lastName;
            filterDto.gender = toOptionalNumber(list.filters.gender);
            filterDto.email = list.filters.email;
            filterDto.country = toOptionalNumber(list.filters.country);
            filterDto.status = toOptionalNumber(list.filters.status);

            return list.applyPagination(
                await userProvider.index(list.buildIndexQuery(new UserIndexQuery(), filterDto)),
            );
        },
    });

    return {
        ...access,
        ...list,
        users: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        fetchUsers: refresh,
    };
}
