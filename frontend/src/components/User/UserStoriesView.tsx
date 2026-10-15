import React from 'react';
import { Button } from 'react-bootstrap';

import { UserSubpageLayout } from './UserSubpageLayout';
import { StoryFilterQuery } from '../../api/queries/StoryFilterQuery';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { UserStoriesTable } from '../Story/UserStoriesTable';

interface UserStoriesViewProps {
    user: UserResponse | null;
    stories: StoryResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: StoryFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (story: StoryResponse) => void;
}

export const UserStoriesView: React.FC<UserStoriesViewProps> = ({
    user,
    stories,
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
}) => {
    const { t } = useTranslation();
    const sortOptions = buildSortOptions(t, ['createdAt', 'text', 'status']);

    return (
        <UserSubpageLayout
            user={user}
            title={t('stories')}
            actions={
                isMyProfile && (
                    <Button variant="profile-primary" onClick={onAddClick}>
                        {t('addStory')}
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
            loading={loading && stories.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UserStoriesTable
                stories={stories}
                isMyProfile={isMyProfile}
                isAdmin={isAdmin}
                onManageClick={onManageClick}
            />
        </UserSubpageLayout>
    );
};
