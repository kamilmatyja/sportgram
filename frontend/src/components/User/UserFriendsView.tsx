import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserFriendsTable } from '../Friend/UserFriendsTable';

interface UserFriendsViewProps {
    user: UserResponse | null;
    friends: FriendResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: FriendFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (friend: FriendResponse) => void;
}

export const UserFriendsView: React.FC<UserFriendsViewProps> = ({
    user,
    friends,
    relatedUsers,
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
    onAddClick,
    onManageClick,
}) => {
    const { t } = useTranslation();
    const sortOptions = buildSortOptions(t, ['createdAt', 'status']);

    return (
        <UserSubpageLayout
            user={user}
            title={t('friend')}
            actions={
                isMyProfile && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addFriend')}
                    </Button>
                )
            }
            filters={
                <>
                    <FilterSelect
                        name="status"
                        value={filters.status || ''}
                        onChange={onFilterChange}
                        options={FriendStatusEnum.getOptions(t)}
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
            loading={loading && friends.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserFriendsTable
                friends={friends}
                relatedUsers={relatedUsers}
                isMyProfile={isMyProfile}
                onManageClick={onManageClick}
            />
        </UserSubpageLayout>
    );
};
