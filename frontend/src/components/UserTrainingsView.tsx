import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { TrainingResponse } from '../api/responses/TrainingResponse';
import { UserResponse } from '../api/responses/UserResponse';
import { TrainingFilterQuery } from '../api/queries/TrainingFilterQuery';
import { ElementStatusEnum } from '../enums/ElementStatusEnum';
import { PaginationEnum } from '../enums/PaginationEnum';
import { ColorEnum } from '../enums/ColorEnum';
import { UserSubpageHeader } from './User/UserSubpageHeader';
import { Pagination } from './Common/Pagination';
import { UserTrainingsTable } from './Training/UserTrainingsTable';

interface UserTrainingsViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    trainings: TrainingResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipant: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: TrainingFilterQuery;
    actionLoading: string | null;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (training: TrainingResponse) => void;
    interactions: any;
}

export const UserTrainingsView: React.FC<UserTrainingsViewProps> = ({
                                                                        user, currentUser, trainings, relatedUsers, isMyProfile, isAdmin, isParticipant, loading, error, page, limit, sort, filters, actionLoading,
                                                                        onFilterChange, onSortChange, onLimitChange, onPrevPage, onNextPage, onAddClick, onManageClick, interactions
                                                                    }) => {
    const { t } = useTranslation();

    if (loading && trainings.length === 0) return <div className="container mt-5 text-center"><div className="spinner-border text-profile-primary" /></div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user} title={t('trainings')} />

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('trainings')}</h4>
                        {(isMyProfile && isParticipant) && (
                            <button className="btn btn-profile-primary" onClick={onAddClick}>
                                <i className="bi bi-plus-lg me-1"></i> {t('addTraining')}
                            </button>
                        )}
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <input name="title" placeholder={t('title')} value={filters.title || ''} onChange={onFilterChange} className="form-control w-auto" />
                        <input name="link" placeholder={t('link')} value={filters.link || ''} onChange={onFilterChange} className="form-control w-auto" />
                        <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                            <option value="">{t('status')}</option>
                            {ElementStatusEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                            <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                            <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                            <option value="startedAt:desc">{t('startedAt')} Z-A</option>
                            <option value="startedAt:asc">{t('startedAt')} A-Z</option>
                        </select>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center my-4"><div className="spinner-border text-profile-primary" /></div>
                    ) : (
                        <>
                            <UserTrainingsTable
                                trainings={trainings}
                                relatedUsers={relatedUsers}
                                currentUser={currentUser}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                actionLoading={actionLoading}
                                onManageClick={onManageClick}
                                interactions={interactions}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={trainings.length >= limit} onPrevPage={onPrevPage} onNextPage={onNextPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};