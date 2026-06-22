import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {Stack, Button} from 'react-bootstrap';

interface PaginationProps {
    page: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({page, hasMore, onPrevPage, onNextPage}) => {
    const {t} = useTranslation();

    return (
        <Stack direction="horizontal" className="justify-content-between align-items-center mb-3">
            <Button variant="profile-outline-primary" className="mx-2" disabled={page === 1} onClick={onPrevPage}>
                {t('prev')}
            </Button>
            <Stack direction="horizontal" as="span">{t('page')} {page}</Stack>
            <Button variant="profile-outline-primary" className="mx-2" disabled={!hasMore} onClick={onNextPage}>
                {t('next')}
            </Button>
        </Stack>
    );
};