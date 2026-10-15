import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { FeedFilterQuery } from '../../api/queries/FeedFilterQuery';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type FeedInteractions } from '../../services/Feed/useFeedInteractions';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserFeedsTable } from '../Feed/UserFeedsTable';

interface UserFeedsViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    feeds: FeedResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: FeedFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (feed: FeedResponse) => void;
    interactions: FeedInteractions;
}

export const UserFeedsView: React.FC<UserFeedsViewProps> = ({
    user,
    feeds,
    relatedUsers,
    currentUser,
    isMyProfile,
    isAdmin,
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
    const sortOptions = buildSortOptions(t, ['createdAt', 'text', 'status']);

    return (
        <UserSubpageLayout
            user={user}
            title={t('feeds')}
            actions={
                isMyProfile && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addFeed')}
                    </Button>
                )
            }
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
            loading={loading && feeds.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserFeedsTable
                feeds={feeds}
                relatedUsers={relatedUsers}
                currentUser={currentUser}
                isMyProfile={isMyProfile}
                isAdmin={isAdmin}
                actionLoading={interactions.actionLoading}
                onManageClick={onManageClick}
                interactions={interactions}
            />
        </UserSubpageLayout>
    );
};
