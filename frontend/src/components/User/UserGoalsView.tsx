import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { GoalFilterQuery } from '../../api/queries/GoalFilterQuery';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type GoalInteractions } from '../../services/Goal/useGoalInteractions';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserGoalsTable } from '../Goal/UserGoalsTable';

interface UserGoalsViewProps {
    user: UserResponse | null;
    goals: GoalResponse[];
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
    filters: GoalFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (goal: GoalResponse) => void;
    interactions: GoalInteractions;
}

export const UserGoalsView: React.FC<UserGoalsViewProps> = ({
    user,
    goals,
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
    const sortOptions = buildSortOptions(t, [
        'createdAt',
        'startedAt',
        'endedAt',
        { field: 'text', label: 'title' },
        'discipline',
        { field: 'distance', numeric: true },
        { field: 'time', label: 'timeSeconds', numeric: true },
        'status',
    ]);

    return (
        <UserSubpageLayout
            user={user}
            title={t('goals')}
            actions={
                isMyProfile &&
                isParticipant && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addGoal')}
                    </Button>
                )
            }
            filters={
                <>
                    <FilterInput
                        name="text"
                        placeholder={t('title')}
                        value={filters.text || ''}
                        onChange={onFilterChange}
                    />
                    <FilterSelect
                        name="discipline"
                        value={filters.discipline || ''}
                        onChange={onFilterChange}
                        options={DisciplineEnum.getOptions(t)}
                        placeholder={t('discipline')}
                    />
                    <FilterSelect
                        name="status"
                        value={filters.status || ''}
                        onChange={onFilterChange}
                        options={GoalStatusEnum.getOptions(t)}
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
            loading={loading && goals.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserGoalsTable
                goals={goals}
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
