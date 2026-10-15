import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { PushSubscriptionResponse } from '../../api/responses/PushSubscriptionResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { buildSortOptions } from '../../utils/options';
import { SortLimitSelect } from '../Common/FilterBar';
import { UserPushSubscriptionsTable } from '../PushSubscription/UserPushSubscriptionsTable';

interface UserPushSubscriptionsViewProps {
    user: UserResponse | null;
    subscriptions: PushSubscriptionResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (subscription: PushSubscriptionResponse) => void;
}

export const UserPushSubscriptionsView: React.FC<UserPushSubscriptionsViewProps> = ({
    user,
    subscriptions,
    isMyProfile,
    isAdmin,
    loading,
    error,
    page,
    hasMore,
    limit,
    sort,
    onSortChange,
    onLimitChange,
    onPrevPage,
    onNextPage,
    onAddClick,
    onManageClick,
}) => {
    const { t } = useTranslation();
    const sortOptions = buildSortOptions(t, ['createdAt', 'endpoint']);

    return (
        <UserSubpageLayout
            user={user}
            title={t('pushSubscriptions')}
            actions={
                isMyProfile && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addSubscription')}
                    </Button>
                )
            }
            filters={
                <SortLimitSelect
                    sortOptions={sortOptions}
                    sort={sort}
                    limit={limit}
                    onSortChange={onSortChange}
                    onLimitChange={onLimitChange}
                />
            }
            loading={loading && subscriptions.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserPushSubscriptionsTable
                subscriptions={subscriptions}
                isMyProfile={isMyProfile}
                isAdmin={isAdmin}
                onManageClick={onManageClick}
            />
        </UserSubpageLayout>
    );
};
