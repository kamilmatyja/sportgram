import React, {useEffect, useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {GoalProvider} from '../api/providers/GoalProvider';
import {GoalResponse} from '../api/responses/GoalResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {GoalFilterQuery} from '../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../api/queries/GoalIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {useCheckPermission} from '../utils/checkPermission';
import {RoleEnum} from '../enums/RoleEnum';

export function useUserGoals(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [goals, setGoals] = useState<GoalResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isParticipant, setIsParticipant] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new GoalFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const userProvider = new UserProvider();
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

            const userIdsToFetch = Array.from(
                new Set(detailedGoals.flatMap(g => g.participants.map(p => p.userId)))
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

                const participantCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.PARTICIPANT) ?? false;
                setIsParticipant(participantCheck);

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
        goals, relatedUsers, targetUser, currentUser, isMyProfile, isAdmin, isParticipant, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshGoals
    };
}