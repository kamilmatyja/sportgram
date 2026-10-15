import React from 'react';

import { UserSubpageLayout } from './UserSubpageLayout';
import { NotificationFilterQuery } from '../../api/queries/NotificationFilterQuery';
import { NotificationResponse } from '../../api/responses/NotificationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserNotificationsTable } from '../Notification/UserNotificationsTable';

interface UserNotificationsViewProps {
    user: UserResponse | null;
    notifications: NotificationResponse[];
    isMyProfile: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: NotificationFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onManageClick: (notification: NotificationResponse) => void;
}

export const UserNotificationsView: React.FC<UserNotificationsViewProps> = ({
    user,
    notifications,
    isMyProfile,
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
    onManageClick,
}) => {
    const { t } = useTranslation();
    const sortOptions = buildSortOptions(t, ['createdAt', 'text', 'status']);

    return (
        <UserSubpageLayout
            user={user}
            title={t('notifications')}
            filters={
                <>
                    <FilterInput
                        name="text"
                        placeholder={t('text')}
                        value={filters.text || ''}
                        onChange={onFilterChange}
                    />
                    <FilterSelect
                        name="status"
                        value={filters.status || ''}
                        onChange={onFilterChange}
                        options={NotificationStatusEnum.getOptions(t)}
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
            loading={loading && notifications.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserNotificationsTable
                notifications={notifications}
                isMyProfile={isMyProfile}
                onManageClick={onManageClick}
            />
        </UserSubpageLayout>
    );
};
