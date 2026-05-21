import React, {useEffect, useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {GoalProvider} from '../api/providers/GoalProvider';
import {GoalResponse} from '../api/responses/GoalResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {GoalFilterQuery} from '../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../api/queries/GoalIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {useCheckPermission} from '../utils/checkPermission';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {RoleEnum} from '../enums/RoleEnum';

export function useUserGoals(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [goals, setGoals] = useState<GoalResponse[]>([]);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new GoalFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();
    const goalProvider = new GoalProvider();

    const fetchGoals = async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new GoalFilterQuery();
            filterDto.userId = userId;
            filterDto.text = filters.text;
            filterDto.discipline = filters.discipline ? Number(filters.discipline) : undefined;
            filterDto.distance = filters.distance ? Number(filters.distance) : undefined;
            filterDto.time = filters.time ? Number(filters.time) : undefined;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new GoalIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await goalProvider.index(indexDto);

            const detailedGoals = await Promise.all(data.map(async (goal) => {
                return await goalProvider.details(goal.id, [
                    'goalParticipants',
                    'goalParticipantResults'
                ]);
            }));

            setGoals(detailedGoals);
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
                    const friends = await friendProvider.index(fIndexDto);

                    const relation = friends.find((f) =>
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

                await fetchGoals(tUser.id);
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

    const refreshGoals = () => {
        if (targetUser) fetchGoals(targetUser.id);
    };

    return {
        goals, targetUser, currentUser, isMyProfile, isAdmin, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshGoals
    };
}