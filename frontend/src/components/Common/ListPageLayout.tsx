import { type FC, type ReactNode } from 'react';
import { Alert, Container, Spinner, Stack } from 'react-bootstrap';

import { Pagination } from './Pagination';
import { useTranslation } from '../../context/TranslationContext';

interface ListPageLayoutProps {
    title: ReactNode;
    actions?: ReactNode;
    filters?: ReactNode;
    loading: boolean;
    error?: string | null;
    page: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    children: ReactNode;
}

export const ListPageLayout: FC<ListPageLayoutProps> = ({
    title,
    actions,
    filters,
    loading,
    error,
    page,
    hasMore,
    onPrevPage,
    onNextPage,
    children,
}) => {
    const { t } = useTranslation();

    return (
        <Container className="py-5">
            <Stack direction="horizontal" gap={2} className="justify-content-between align-items-center flex-wrap mb-4">
                <Stack as="h2" className="mb-0 fw-bold text-primary">
                    {title}
                </Stack>
                {actions}
            </Stack>
            {filters}
            {loading ? (
                <Stack className="text-center p-5">
                    <Spinner animation="border" variant="primary" role="status" />
                </Stack>
            ) : error ? (
                <Alert variant="danger">{t(error)}</Alert>
            ) : (
                <>
                    {children}
                    <Stack className="mt-3">
                        <Pagination page={page} hasMore={hasMore} onPrevPage={onPrevPage} onNextPage={onNextPage} />
                    </Stack>
                </>
            )}
        </Container>
    );
};
