import React, {useEffect, useState} from 'react';
import {UserProvider} from '../../api/providers/UserProvider';
import {PageProvider} from '../../api/providers/PageProvider';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {useCheckPermission} from '../../utils/checkPermission';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {RoleEnum} from '../../enums/RoleEnum';

export function useUserPages(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [pages, setPages] = useState<PageResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isOrganizer, setIsOrganizer] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new PageFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const pageProvider = new PageProvider();
    const friendProvider = new FriendProvider();

    const fetchPages = async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new PageFilterQuery();
            filterDto.userId = userId;
            filterDto.title = filters.title;
            filterDto.link = filters.link;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new PageIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await pageProvider.index(indexDto);

            const detailedPages = await Promise.all(data.map(async (p) => {
                return await pageProvider.details(p.id, [
                    'pageParticipants',
                    'pageFollows'
                ]);
            }));

            setPages(detailedPages);

            const userIdsToFetch = new Set<string>();
            detailedPages.forEach(p => {
                p.participants.forEach(part => userIdsToFetch.add(part.userId));
                p.follows?.forEach(f => userIdsToFetch.add(f.userId));
            });

            const idsArray = Array.from(userIdsToFetch);
            if (idsArray.length > 0) {
                const uFilter = new UserFilterQuery();
                uFilter.userIds = idsArray;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                uIndexDto.limit = idsArray.length;
                const usersData = await userProvider.index(uIndexDto);
                const usersMap = usersData.reduce((acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {} as Record<string, UserResponse>);
                setRelatedUsers(usersMap);
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
                setCurrentUser(currentUsr);

                if (!currentUsr || !link) {
                    setError('unauthorizedEdit');
                    return;
                }

                const adminCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
                setIsAdmin(adminCheck);

                const organizerCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ORGANIZER) ?? false;
                setIsOrganizer(organizerCheck);

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
                    fFilter.status = FriendStatusEnum.ACCEPTED;
                    fFilter.userIds = [tUser.id, currentUsr.id];
                    const fIndexDto = new FriendIndexQuery();
                    fIndexDto.filter = fFilter;
                    const friends = await friendProvider.index(fIndexDto);

                    const hasRelation = friends.some(f =>
                        (f.senderUserId === tUser.id && f.receiverUserId === currentUsr.id) ||
                        (f.senderUserId === currentUsr.id && f.receiverUserId === tUser.id)
                    );

                    if (! hasRelation) {
                        setError('accessDenied');
                        setLoading(false);
                        return;
                    }
                }

                await fetchPages(tUser.id);
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

    const refreshPages = () => {
        if (targetUser) fetchPages(targetUser.id);
    };

    return {
        pages,
        relatedUsers,
        targetUser,
        currentUser,
        isMyProfile,
        isAdmin,
        isOrganizer,
        page,
        limit,
        sort,
        filters,
        loading,
        error,
        handleFilterChange,
        handleSortChange,
        handleLimitChange,
        handlePrevPage,
        handleNextPage,
        refreshPages
    };
}