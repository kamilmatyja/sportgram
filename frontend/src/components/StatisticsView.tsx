import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {StatisticResponse} from '../api/responses/StatisticResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {StatisticFilterQuery} from '../api/queries/StatisticFilterQuery';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {PaginationEnum} from '../enums/PaginationEnum';
import {formatDate} from '../utils/dateFormat';

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
    const {t} = useTranslation();

    if (!currentUser) return <div className="container mt-5 text-center"><div className="spinner-border"/></div>;

    const getUserName = (id: string) => {
        const u = availableUsers.find(au => au.id === id);
        return u ? `${u.firstName} ${u.lastName}` : id;
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow-sm">
                <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'records' ? 'active fw-bold' : 'text-muted'}`}
                                onClick={() => { setActiveTab('records'); handleSortChange({ target: { value: 'time:asc' } } as any); }}
                            >
                                {t('records')}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'progress' ? 'active fw-bold' : 'text-muted'}`}
                                onClick={() => { setActiveTab('progress'); handleSortChange({ target: { value: 'createdAt:desc' } } as any); }}
                            >
                                {t('progress')}
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body pt-4">
                    <div className="row mb-4">
                        <div className="col-12 col-lg-3 mb-3 mb-lg-0">
                            <label className="form-label fw-bold">{t('selectFriends')}</label>
                            <select
                                multiple
                                className="form-select"
                                value={filters.userIds || []}
                                onChange={handleUsersChange}
                            >
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.firstName} {u.lastName} {u.id === currentUser.id ? `(${t('profile')})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg-9 d-flex flex-wrap gap-3 align-items-end">
                            <div>
                                <label className="form-label small text-muted mb-1">{t('discipline')}</label>
                                <select name="discipline" value={filters.discipline || ''} onChange={handleFilterChange} className="form-select w-auto">
                                    <option value="">{t('selectOption')}</option>
                                    {DisciplineEnum.getOptions(t).map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="form-label small text-muted mb-1">{t('distance')}</label>
                                <input type="number" name="distance" placeholder={t('distanceMeters')} value={filters.distance || ''} onChange={handleFilterChange} className="form-control w-auto"/>
                            </div>
                            <div className="ms-auto d-flex gap-3">
                                <div>
                                    <label className="form-label small text-muted mb-1">{t('sortCreatedDesc').split(' ')[0]}</label>
                                    <select value={sort} onChange={handleSortChange} className="form-select w-auto">
                                        {activeTab === 'progress' ? (
                                            <>
                                                <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                                                <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                                                <option value="time:desc">{t('timeSeconds')} 9-0</option>
                                                <option value="time:asc">{t('timeSeconds')} 0-9</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="time:asc">{t('timeSeconds')} 0-9</option>
                                                <option value="time:desc">{t('timeSeconds')} 9-0</option>
                                                <option value="distance:desc">{t('distance')} 9-0</option>
                                                <option value="distance:asc">{t('distance')} 0-9</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label small text-muted mb-1">{t('page')}</label>
                                    <select value={limit} onChange={handleLimitChange} className="form-select w-auto">
                                        {PaginationEnum.getOptions(t).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading && data.length === 0 ? <div className="text-center"><div className="spinner-border"/></div> : error ? <div className="alert alert-danger">{t(error)}</div> : (
                        <>
                            <div className="table-responsive-custom">
                                <table className="table table-bordered table-hover align-middle">
                                    <thead className="table-light">
                                    <tr>
                                        <th>{t('user')}</th>
                                        <th>{t('discipline')}</th>
                                        <th>{t('distance')} [m]</th>
                                        <th>{t('timeSeconds')}</th>
                                        <th>{t('createdAt')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted">
                                                {activeTab === 'records' ? t('noRecords') : t('noProgress')}
                                            </td>
                                        </tr>
                                    ) : data.map((stat, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold">
                                                <a href={`/users/${stat.userId}`} className="btn btn-link p-0 text-decoration-none">
                                                    {getUserName(stat.userId)}
                                                </a></td>
                                            <td>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(stat.discipline))?.label || stat.discipline}</td>
                                            <td>{stat.distance}</td>
                                            <td>{stat.time}</td>
                                            <td>{formatDate(stat.createdAt)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <button className="btn btn-outline-primary mx-2" disabled={page === 1} onClick={handlePrevPage}>{t('prev')}</button>
                                <span>{t('page')} {page}</span>
                                <button className="btn btn-outline-primary mx-2" disabled={data.length < limit} onClick={handleNextPage}>{t('next')}</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};