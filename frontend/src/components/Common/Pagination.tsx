import React from 'react';
import { Stack, Button } from 'react-bootstrap';

import { useTranslation } from '../../context/TranslationContext';

interface PaginationProps {
    page: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    variant?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ page, hasMore, onPrevPage, onNextPage, variant }) => {
    const { t } = useTranslation();
    const buttonVariant = variant || 'outline-primary';

    return (
        <Stack direction="horizontal" gap={3} className="justify-content-center align-items-center w-100 mb-3">
            <Button variant={buttonVariant} disabled={page === 1} onClick={onPrevPage} className="flex-shrink-0">
                {t('prev')}
            </Button>
            <Stack as="span" className="fw-bold flex-grow-1 align-items-center justify-content-center text-center">
                {t('page')} {page}
            </Stack>
            <Button variant={buttonVariant} disabled={!hasMore} onClick={onNextPage} className="flex-shrink-0">
                {t('next')}
            </Button>
        </Stack>
    );
};
