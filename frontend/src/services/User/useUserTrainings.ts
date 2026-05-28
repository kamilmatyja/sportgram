import React, {useEffect, useState} from 'react';
import {TrainingProvider} from '../../api/providers/TrainingProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {TrainingFilterQuery} from '../../api/queries/TrainingFilterQuery';
import {TrainingIndexQuery} from '../../api/queries/TrainingIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';

export function useUserTrainings(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [trainings, setTrainings] = useState<TrainingResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new TrainingFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const trainingProvider = new TrainingProvider();

    const fetchTrainings = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
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

            const userIds = detailedTrainings.flatMap(t => t.participants.map(p => p.userId));
            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchTrainings(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, page, limit, sort, filters]);

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
        if (access.targetUser) fetchTrainings(access.targetUser.id);
    };

    return {
        ...access,
        trainings, relatedUsers, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshTrainings
    };
}