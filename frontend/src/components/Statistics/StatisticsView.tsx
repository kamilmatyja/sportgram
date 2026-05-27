import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { StatisticResponse } from '../../api/responses/StatisticResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { StatisticFilterQuery } from '../../api/queries/StatisticFilterQuery';
import { Pagination } from '../Common/Pagination';
import { StatisticsFilterBar } from './StatisticsFilterBar';
import { StatisticsTable } from './StatisticsTable';

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
                                                                  currentUser, availableUsers, activeTab, setActiveTab, data, page, limit, sort, filters, loading, error,
                                                                  handleFilterChange, handleUsersChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage
                                                              }) => {
    const { t } = useTranslation();

    if (!currentUser) return (
        <div className="container mt-5 text-center">
            <div className="spinner-border text-profile-primary" />
        </div>
    );

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow-sm">
                <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'records' ? 'active fw-bold' : 'text-muted'}`}
                                onClick={() => {
                                    setActiveTab('records');
                                    handleSortChange({ target: { value: 'time:asc' } } as any);
                                }}
                            >
                                {t('records')}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'progress' ? 'active fw-bold' : 'text-muted'}`}
                                onClick={() => {
                                    setActiveTab('progress');
                                    handleSortChange({ target: { value: 'createdAt:desc' } } as any);
                                }}
                            >
                                {t('progress')}
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body pt-4">
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
                        <div className="text-center"><div className="spinner-border text-profile-primary" /></div>
                    ) : error ? (
                        <div className="alert alert-danger">{t(error)}</div>
                    ) : (
                        <>
                            <StatisticsTable
                                data={data}
                                availableUsers={availableUsers}
                                activeTab={activeTab}
                            />

                            <div className="mt-3">
                                <Pagination
                                    page={page}
                                    hasMore={data.length >= limit}
                                    onPrevPage={handlePrevPage}
                                    onNextPage={handleNextPage}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};