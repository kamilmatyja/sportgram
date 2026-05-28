import {useEffect, useState} from 'react';
import {TrainingProvider} from '../../api/providers/TrainingProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {TrainingFilterQuery} from '../../api/queries/TrainingFilterQuery';
import {TrainingIndexQuery} from '../../api/queries/TrainingIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUserTrainings(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [trainings, setTrainings] = useState<TrainingResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new TrainingFilterQuery());

    const userProvider = new UserProvider();
    const trainingProvider = new TrainingProvider();

    const fetchTrainings = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new TrainingFilterQuery();
            filterDto.userId = userId;
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new TrainingIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await trainingProvider.index(indexDto);

            const detailedTrainings = await Promise.all(data.map(async (tr) => {
                return await trainingProvider.details(tr.id, [
                    'trainingDisciplines', 'trainingDisciplineDistances', 'trainingDisciplineSubDistances', 'trainingParticipants'
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
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshTrainings = () => {
        if (access.targetUser) fetchTrainings(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        trainings, relatedUsers,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshTrainings
    };
}