import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {StatisticResponse} from '../../api/responses/StatisticResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {StatisticFilterQuery} from '../../api/queries/StatisticFilterQuery';
import {Pagination} from '../Common/Pagination';
import {StatisticsFilterBar} from './StatisticsFilterBar';
import {StatisticsTable} from './StatisticsTable';
import {Container, Card, Nav, Button, Stack, Spinner, Alert} from 'react-bootstrap';

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
    handleFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
                                                                  handleNextPage
                                                              }) => {
    const {t} = useTranslation();

    if (!currentUser) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" className="text-profile-primary" />
        </Container>
    );

    return (
        <Container className="mt-4 mb-5">
            <Card className="shadow-sm">
                <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
                    <Nav variant="tabs">
                        <Nav.Item>
                            <Button
                                variant="link"
                                className={`nav-link text-decoration-none ${activeTab === 'records' ? 'active fw-bold' : 'text-muted'}`}
                                onClick={() => {
                                    setActiveTab('records');
                                    handleSortChange({target: {value: 'time:asc'}} as any);
                                }}
                            >
                                {t('records')}
                            </Button>
                        </Nav.Item>
                        <Nav.Item>
                            <Button
                                variant="link"
                                className={`nav-link text-decoration-none ${activeTab === 'progress' ? 'active fw-bold' : 'text-muted'}`}
                                onClick={() => {
                                    setActiveTab('progress');
                                    handleSortChange({target: {value: 'createdAt:desc'}} as any);
                                }}
                            >
                                {t('progress')}
                            </Button>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body className="pt-4">
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
                        <Stack className="text-center">
                            <Spinner animation="border" className="text-profile-primary" />
                        </Stack>
                    ) : error ? (
                        <Alert variant="danger">{t(error)}</Alert>
                    ) : (
                        <>
                            <StatisticsTable
                                data={data}
                                availableUsers={availableUsers}
                            />

                            <Stack className="mt-3">
                                <Pagination
                                    page={page}
                                    hasMore={data.length >= limit}
                                    onPrevPage={handlePrevPage}
                                    onNextPage={handleNextPage}
                                />
                            </Stack>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};