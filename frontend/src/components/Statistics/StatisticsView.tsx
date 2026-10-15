import React from 'react';
import { Container, Card, Nav, Button, Stack, Spinner, Alert } from 'react-bootstrap';

import { StatisticsFilterBar } from './StatisticsFilterBar';
import { StatisticsTable } from './StatisticsTable';
import { StatisticFilterQuery } from '../../api/queries/StatisticFilterQuery';
import { StatisticResponse } from '../../api/responses/StatisticResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { FormErrorAlert } from '../Common/FormFields';
import { Pagination } from '../Common/Pagination';
import { ErrorView, LoadingView } from '../Common/ViewState';

interface StatisticsViewProps {
    currentUser: UserResponse | null;
    availableUsers: UserResponse[];
    usersError: string | null;
    activeTab: 'records' | 'progress';
    setActiveTab: (tab: 'records' | 'progress') => void;
    data: StatisticResponse[];
    page: number;
    hasMore: boolean;
    limit: number;
    sort: string;
    filters: StatisticFilterQuery;
    loading: boolean;
    error: string | null;
    handleFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleUsersChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handlePrevPage: () => void;
    handleNextPage: () => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
    currentUser,
    availableUsers,
    usersError,
    activeTab,
    setActiveTab,
    data,
    page,
    hasMore,
    limit,
    sort,
    filters,
    loading,
    error,
    handleFilterChange,
    handleUsersChange,
    handleSortChange,
    handleLimitChange,
    handlePrevPage,
    handleNextPage,
}) => {
    const { t } = useTranslation();

    if (!currentUser) return error && !loading ? <ErrorView error={error} /> : <LoadingView />;

    return (
        <Container className="py-5">
            <Stack direction="horizontal" gap={2} className="justify-content-between align-items-center flex-wrap mb-4">
                <Stack as="h2" className="mb-0 fw-bold text-primary">
                    {t('statistics')}
                </Stack>
            </Stack>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-0 pb-0">
                    <Nav variant="tabs" className="border-bottom-0">
                        <Nav.Item>
                            <Button
                                variant="link"
                                className={`nav-link text-decoration-none ${activeTab === 'records' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                onClick={() => {
                                    setActiveTab('records');
                                    handleSortChange({ target: { value: 'time:asc' } } as any);
                                }}
                            >
                                {t('records')}
                            </Button>
                        </Nav.Item>
                        <Nav.Item>
                            <Button
                                variant="link"
                                className={`nav-link text-decoration-none ${activeTab === 'progress' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                onClick={() => {
                                    setActiveTab('progress');
                                    handleSortChange({ target: { value: 'createdAt:desc' } } as any);
                                }}
                            >
                                {t('progress')}
                            </Button>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body className="bg-white rounded-bottom">
                    <FormErrorAlert error={usersError} />
                    <StatisticsFilterBar
                        filters={filters}
                        sort={sort}
                        limit={limit}
                        availableUsers={availableUsers}
                        currentUser={currentUser}
                        onFilterChange={handleFilterChange}
                        onUsersChange={handleUsersChange}
                        onSortChange={handleSortChange}
                        onLimitChange={handleLimitChange}
                    />

                    {loading && data.length === 0 ? (
                        <Stack className="text-center p-5">
                            <Spinner animation="border" variant="primary" role="status" />
                        </Stack>
                    ) : error ? (
                        <Alert variant="danger">{t(error)}</Alert>
                    ) : (
                        <>
                            <StatisticsTable data={data} availableUsers={availableUsers} />
                            <Stack className="mt-3">
                                <Pagination
                                    page={page}
                                    hasMore={hasMore}
                                    onPrevPage={handlePrevPage}
                                    onNextPage={handleNextPage}
                                    variant="profile-outline-primary"
                                />
                            </Stack>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};
