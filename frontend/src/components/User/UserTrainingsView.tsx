import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { TrainingFilterQuery } from '../../api/queries/TrainingFilterQuery';
import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type TrainingInteractions } from '../../services/Training/useTrainingInteractions';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserTrainingsTable } from '../Training/UserTrainingsTable';

interface UserTrainingsViewProps {
    user: UserResponse | null;
    trainings: TrainingResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipant: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: TrainingFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (training: TrainingResponse) => void;
    interactions: TrainingInteractions;
}

export const UserTrainingsView: React.FC<UserTrainingsViewProps> = ({
    user,
    trainings,
    relatedUsers,
    currentUser,
    isMyProfile,
    isAdmin,
    isParticipant,
    loading,
    error,
    page,
    hasMore,
    limit,
    sort,
    filters,
    onFilterChange,
    onSortChange,
    onLimitChange,
    onPrevPage,
    onNextPage,
    onAddClick,
    onManageClick,
    interactions,
}) => {
    const { t } = useTranslation();
    const sortOptions = buildSortOptions(t, ['createdAt', 'startedAt', 'endedAt', 'title', 'location', 'status']);

    return (
        <UserSubpageLayout
            user={user}
            title={t('trainings')}
            actions={
                isMyProfile &&
                isParticipant && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addTraining')}
                    </Button>
                )
            }
            filters={
                <>
                    <FilterInput
                        name="title"
                        placeholder={t('title')}
                        value={filters.title || ''}
                        onChange={onFilterChange}
                    />
                    <FilterSelect
                        name="status"
                        value={filters.status || ''}
                        onChange={onFilterChange}
                        options={ElementStatusEnum.getOptions(t)}
                        placeholder={t('status')}
                    />
                    <SortLimitSelect
                        sortOptions={sortOptions}
                        sort={sort}
                        limit={limit}
                        onSortChange={onSortChange}
                        onLimitChange={onLimitChange}
                    />
                </>
            }
            loading={loading && trainings.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserTrainingsTable
                trainings={trainings}
                relatedUsers={relatedUsers}
                currentUser={currentUser}
                isMyProfile={isMyProfile}
                isAdmin={isAdmin}
                onManageClick={onManageClick}
                interactions={interactions}
                actionLoading={interactions.actionLoading}
            />
        </UserSubpageLayout>
    );
};
