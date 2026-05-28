import React, {useEffect, useState} from 'react';
import {TrainingProvider} from '../../api/providers/TrainingProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {TrainingFilterQuery} from '../../api/queries/TrainingFilterQuery';
import {TrainingIndexQuery} from '../../api/queries/TrainingIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {profileAccess} from '../../utils/profileAccess.ts';

export function useUserTrainings(link?: string) {
    const {checkAccess} = profileAccess();

    const [trainings, setTrainings] = useState<TrainingResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isParticipant, setIsParticipant] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new TrainingFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const trainingProvider = new TrainingProvider();

    const fetchTrainings = async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new TrainingFilterQuery();
            filterDto.userId = userId;
            filterDto.title = filters.title;
            filterDto.link = filters.link;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new TrainingIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await trainingProvider.index(indexDto);

            const detailedTrainings = await Promise.all(data.map(async (tr) => {
                return await trainingProvider.details(tr.id, [
                    'trainingDisciplines',
                    'trainingDisciplineDistances',
                    'trainingDisciplineSubDistances',
                    'trainingParticipants'
                ]);
            }));

            setTrainings(detailedTrainings);

            const userIdsToFetch = Array.from(
                new Set(detailedTrainings.flatMap(t => t.participants.map(p => p.userId)))
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
        const init = async () => {
            setLoading(true);
            try {
                if (!link) {
                    setError('userNotFound');
                    return;
                }

                const access = await checkAccess({ link }, { requireFriendship: true });

                setCurrentUser(access.currentUser);
                setTargetUser(access.targetUser);
                setIsAdmin(access.isAdmin);
                setIsParticipant(access.isParticipant);
                setIsMyProfile(access.isMyProfile);

                await fetchTrainings(access.targetUser.id);
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        init();
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

    const refreshTrainings = () => {
        if (targetUser) fetchTrainings(targetUser.id);
    };

    return {
        trainings, relatedUsers, targetUser, currentUser, isMyProfile, isAdmin, isParticipant,
        page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshTrainings
    };
}