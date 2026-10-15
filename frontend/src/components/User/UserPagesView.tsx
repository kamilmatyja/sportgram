import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type PageInteractions } from '../../services/Page/usePageInteractions';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserPagesTable } from '../Page/UserPagesTable';

interface UserPagesViewProps {
    user: UserResponse | null;
    pages: PageResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: PageFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (pageObj: PageResponse) => void;
    interactions: PageInteractions;
}

export const UserPagesView: React.FC<UserPagesViewProps> = ({
    user,
    pages,
    relatedUsers,
    currentUser,
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
    const sortOptions = buildSortOptions(t, ['createdAt', 'title', 'status']);

    return (
        <UserSubpageLayout
            user={user}
            title={t('pages')}
            actions={
                isMyProfile &&
                isOrganizer && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addPage')}
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
            loading={loading && pages.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserPagesTable
                pages={pages}
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
