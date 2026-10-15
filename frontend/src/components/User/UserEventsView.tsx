import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type EventInteractions } from '../../services/Event/useEventInteractions';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserEventsTable } from '../Event/UserEventsTable';

interface UserEventsViewProps {
    user: UserResponse | null;
    events: EventResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: EventFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (eventObj: EventResponse) => void;
    interactions: EventInteractions;
}

export const UserEventsView: React.FC<UserEventsViewProps> = ({
    user,
    events,
    isMyProfile,
    isAdmin,
    isOrganizer,
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
            title={t('events')}
            actions={
                isMyProfile &&
                isOrganizer && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addEvent')}
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
            loading={loading && events.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserEventsTable
                events={events}
                isMyProfile={isMyProfile}
                isAdmin={isAdmin}
                onManageClick={onManageClick}
                interactions={interactions}
            />
        </UserSubpageLayout>
    );
};
