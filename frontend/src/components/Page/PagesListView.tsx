import React from 'react';
import { Button } from 'react-bootstrap';

import { PagesFilterBar } from './PagesFilterBar';
import { PagesTable } from './PagesTable';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ListPageLayout } from '../Common/ListPageLayout';

interface PagesListViewProps {
    pages: PageResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: PageFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
}

export const PagesListView: React.FC<PagesListViewProps> = ({
    pages,
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
}) => {
    const { t } = useTranslation();

    return (
        <ListPageLayout
            title={t('pages')}
            actions={
                isOrganizer && (
                    <Button variant="primary" onClick={onAddClick}>
                        {t('addPage')}
                    </Button>
                )
            }
            filters={
                <PagesFilterBar
                    filters={filters}
                    sort={sort}
                    limit={limit}
                    onFilterChange={onFilterChange}
                    onSortChange={onSortChange}
                    onLimitChange={onLimitChange}
                />
            }
            loading={loading && pages.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <PagesTable pages={pages} />
        </ListPageLayout>
    );
};
