import React from 'react';
import { Container, Card, Nav, Button, Stack, Spinner, Alert } from 'react-bootstrap';

import { StatisticsFilterBar } from './StatisticsFilterBar';
import { StatisticsTable } from './StatisticsTable';
import { StatisticFilterQuery } from '../../api/queries/StatisticFilterQuery';
import { StatisticResponse } from '../../api/responses/StatisticResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { Pagination } from '../Common/Pagination';

interface StatisticsViewProps {
    currentUser: UserResponse | null;
    availableUsers: UserResponse[];
    activeTab: 'records' | 'progress';
    setActiveTab: (tab: 'records' | 'progress') => void;
    data: StatisticResponse[];
    page: number;
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
    activeTab,
    setActiveTab,
    data,
    page,
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

    if (!currentUser)
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );

    return (
        <Container className="py-5">
            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
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
                    <StatisticsFilterBar
                        filters={filters}
                        sort={sort}
                        limit={limit}
                        activeTab={activeTab}
                        availableUsers={availableUsers}
                        currentUser={currentUser}
                        onFilterChange={handleFilterChange}
                        onUsersChange={handleUsersChange}
                        onSortChange={handleSortChange}
                        onLimitChange={handleLimitChange}
                    />

                    {loading && data.length === 0 ? (
                        <Stack className="text-center p-5">
                            <Spinner animation="border" variant="primary" />
                        </Stack>
                    ) : error ? (
                        <Alert variant="danger">{t(error)}</Alert>
                    ) : (
                        <Stack gap={3}>
                            <StatisticsTable data={data} availableUsers={availableUsers} />
                            <Pagination
                                page={page}
                                hasMore={data.length >= limit}
                                onPrevPage={handlePrevPage}
                                onNextPage={handleNextPage}
                            />
                        </Stack>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};
