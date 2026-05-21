import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {useCheckPermission} from '../utils/checkPermission';
import {UserResponse} from "../api/responses/UserResponse.ts";
import {useEffect, useState} from "react";
import {FriendResponse} from "../api/responses/FriendResponse.ts";
import {FriendFilterQuery} from "../api/queries/FriendFilterQuery.ts";
import {RoleEnum} from "../enums/RoleEnum.ts";
import {FriendStatusEnum} from "../enums/FriendStatusEnum.ts";

export function useUserFriends(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [friends, setFriends] = useState<FriendResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new FriendFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const fetchFriends = async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new FriendFilterQuery();
            filterDto.userIds = [userId];
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new FriendIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await friendProvider.index(indexDto);
            setFriends(data);

            const userIdsToFetch = Array.from(
                new Set(data.flatMap(f => [f.senderUserId, f.receiverUserId]))
            );

            if (userIdsToFetch.length > 0) {
                const uFilter = new UserFilterQuery();
                uFilter.userIds = userIdsToFetch;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                uIndexDto.limit = userIdsToFetch.length;

                const usersData = await userProvider.index(uIndexDto);

                const usersMap = usersData.reduce((acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {} as Record<string, UserResponse>);

                setRelatedUsers(usersMap);
            } else {
                setRelatedUsers({});
            }

        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAccessAndFetch = async () => {
            try {
                setLoading(true);
                const currentUsr = await getCurrentUser();

                if (!currentUsr || !link) {
                    setError('unauthorizedEdit');
                    return;
                }

                const adminCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
                setIsAdmin(adminCheck);

                const uFilter = new UserFilterQuery();
                uFilter.link = link;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                const targetUsers = await userProvider.index(uIndexDto);

                if (targetUsers.length === 0) {
                    setError('userNotFound');
                    return;
                }

                const tUser = targetUsers[0];
                const fullTargetUser = await userProvider.details(tUser.id, ['userRoles', 'userDisciplines']);
                setTargetUser(fullTargetUser);

                const isOwner = currentUsr.id === tUser.id;
                setIsMyProfile(isOwner);

                if (!isOwner && !adminCheck) {
                    const fFilter = new FriendFilterQuery();
                    fFilter.userIds = [tUser.id, currentUsr.id];
                    const fIndexDto = new FriendIndexQuery();
                    fIndexDto.filter = fFilter;
                    const checkFriends = await friendProvider.index(fIndexDto);

                    const relation = checkFriends.find((f) =>
                        ((f.senderUserId === currentUsr.id && f.receiverUserId === tUser.id) ||
                            (f.senderUserId === tUser.id && f.receiverUserId === currentUsr.id)) &&
                        f.status === FriendStatusEnum.ACCEPTED
                    );

                    if (!relation) {
                        setError('accessDenied');
                        setLoading(false);
                        return;
                    }
                }

                await fetchFriends(tUser.id);
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        checkAccessAndFetch();
    }, [link, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    const refreshFriends = () => {
        if (targetUser) fetchFriends(targetUser.id);
    };

    return {
        friends, relatedUsers, targetUser, isMyProfile, isAdmin, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshFriends
    };
}