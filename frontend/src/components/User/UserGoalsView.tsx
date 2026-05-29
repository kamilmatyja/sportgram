import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {GoalFilterQuery} from '../../api/queries/GoalFilterQuery';
import {GoalStatusEnum} from '../../enums/GoalStatusEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserSubpageHeader} from './UserSubpageHeader';
import {Pagination} from '../Common/Pagination';
import {UserGoalsTable} from '../Goal/UserGoalsTable';

interface UserGoalsViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    goals: GoalResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipant: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: GoalFilterQuery;
    actionLoading: string | null;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (goal: GoalResponse) => void;
    interactions: any;
}

export const UserGoalsView: React.FC<UserGoalsViewProps> = ({
                                                                user,
                                                                currentUser,
                                                                goals,
                                                                relatedUsers,
                                                                isMyProfile,
                                                                isAdmin,
                                                                isParticipant,
                                                                loading,
                                                                error,
                                                                page,
                                                                limit,
                                                                sort,
                                                                filters,
                                                                actionLoading,
                                                                onFilterChange,
                                                                onSortChange,
                                                                onLimitChange,
                                                                onPrevPage,
                                                                onNextPage,
                                                                onAddClick,
                                                                onManageClick,
                                                                interactions
                                                            }) => {
    const {t} = useTranslation();

    if (loading && goals.length === 0) return <div className="container mt-5 text-center">
        <div className="spinner-border text-profile-primary"/>
    </div>;
    if (error || !user) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user}/>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('goals')}</h4>
                        {(isMyProfile && isParticipant) && (
                            <button className="btn btn-profile-primary" onClick={onAddClick}>
                                {t('addGoal')}
                            </button>
                        )}
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <input name="text" placeholder={t('title')} value={filters.text || ''} onChange={onFilterChange}
                               className="form-control w-auto"/>
                        <select name="discipline" value={filters.discipline || ''} onChange={onFilterChange}
                                className="form-select w-auto">
                            <option value="">{t('discipline')}</option>
                            {DisciplineEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                             value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select name="status" value={filters.status || ''} onChange={onFilterChange}
                                className="form-select w-auto">
                            <option value="">{t('status')}</option>
                            {GoalStatusEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                             value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                            <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                            <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                            <option value="startedAt:desc">{t('startedAt')} Z-A</option>
                            <option value="startedAt:asc">{t('startedAt')} A-Z</option>
                        </select>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                             value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center my-4">
                            <div className="spinner-border text-profile-primary"/>
                        </div>
                    ) : (
                        <>
                            <UserGoalsTable
                                goals={goals}
                                relatedUsers={relatedUsers}
                                currentUser={currentUser}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                actionLoading={actionLoading}
                                onManageClick={onManageClick}
                                interactions={interactions}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={goals.length >= limit} onPrevPage={onPrevPage}
                                            onNextPage={onNextPage}/>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};