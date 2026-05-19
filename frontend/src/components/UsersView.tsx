import React from 'react';
import {GenderEnum} from '../enums/GenderEnum';
import {CountryEnum} from '../enums/CountryEnum';
import {UserStatusEnum} from '../enums/UserStatusEnum';
import {PaginationEnum} from '../enums/PaginationEnum';
import {formatDate} from '../utils/dateFormat';
import {UserResponse} from '../api/responses/UserResponse';
import {useTranslation} from '../context/TranslationContext';

export interface UserFilters {
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    country: string;
    status: string;
    link: string;
}

interface UsersViewProps {
    filters: UserFilters;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    sort: string;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    limit: number;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    users: UserResponse[];
    loading: boolean;
    error: string | null;
    page: number;
    onPrevPage: () => void;
    onNextPage: () => void;
    isAdmin?: boolean;
    onAddUserClick?: () => void;
}

export default function UsersView({
                                      filters,
                                      onFilterChange,
                                      sort,
                                      onSortChange,
                                      limit,
                                      onLimitChange,
                                      users,
                                      loading,
                                      error,
                                      page,
                                      onPrevPage,
                                      onNextPage,
                                      isAdmin,
                                      onAddUserClick
                                  }: UsersViewProps) {
    const {t} = useTranslation();

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">{t('userTitle')}</h2>
                {isAdmin && (
                    <button className="btn btn-success" onClick={onAddUserClick}>
                        {t('addUser')}
                    </button>
                )}
            </div>

            <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                <input name="firstName" placeholder={t('firstName')} value={filters.firstName} onChange={onFilterChange}
                       className="form-control w-auto"/>
                <input name="lastName" placeholder={t('lastName')} value={filters.lastName} onChange={onFilterChange}
                       className="form-control w-auto"/>
                <input name="email" placeholder={t('email')} value={filters.email} onChange={onFilterChange}
                       className="form-control w-auto"/>
                <input name="link" placeholder={t('link')} value={filters.link} onChange={onFilterChange}
                       className="form-control w-auto"/>
                <select name="gender" value={filters.gender} onChange={onFilterChange} className="form-select w-auto">
                    <option value="">{t('gender')}</option>
                    {GenderEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select name="country" value={filters.country} onChange={onFilterChange} className="form-select w-auto">
                    <option value="">{t('country')}</option>
                    {CountryEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select name="status" value={filters.status} onChange={onFilterChange} className="form-select w-auto">
                    <option value="">{t('status')}</option>
                    {UserStatusEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                <select value={sort} onChange={onSortChange} className="form-select w-auto">
                    <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                    <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                    <option value="firstName:asc">{t('sortFirstNameAsc')}</option>
                    <option value="firstName:desc">{t('sortFirstNameDesc')}</option>
                    <option value="lastName:asc">{t('sortLastNameAsc')}</option>
                    <option value="lastName:desc">{t('sortLastNameDesc')}</option>
                </select>
                <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                    {PaginationEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className="mb-3"/>
            {loading ? <div>{t('loading')}</div> : error ? <div className="text-danger">{error}</div> : (
                <>
                    <table className="table table-bordered table-hover">
                        <thead>
                        <tr>
                            <th>{t('photo')}</th>
                            <th>{t('firstName')}</th>
                            <th>{t('lastName')}</th>
                            <th>{t('email')}</th>
                            <th>{t('gender')}</th>
                            <th>{t('country')}</th>
                            <th>{t('status')}</th>
                            <th>{t('createdAt')}</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.length === 0 ? <tr>
                            <td colSpan={9}>{t('noUsers')}</td>
                        </tr> : users.map(u => (
                            <tr key={u.id}>
                                <td>
                                    {u.profilePhoto ? (
                                        <img src={`data:image/webp;base64,${u.profilePhoto}`} alt="avatar"
                                             className="rounded-circle" width={40} height={40}/>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                <td>{u.firstName}</td>
                                <td>{u.lastName}</td>
                                <td>{u.email}</td>
                                <td>{GenderEnum.getOptions(t).find(opt => String(opt.value) === String(u.gender))?.label || u.gender}</td>
                                <td>{CountryEnum.getOptions(t).find(opt => String(opt.value) === String(u.country))?.label || u.country}</td>
                                <td>{UserStatusEnum.getOptions(t).find(opt => String(opt.value) === String(u.status))?.label || u.status}</td>
                                <td>{formatDate(u.createdAt)}</td>
                                <td>
                                    <a href={`/users/${u.link}`}
                                       className="btn btn-sm btn-outline-secondary"
                                       title={t('goToProfile')}>
                                        <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                                        <span className="visually-hidden">{t('goToProfile')}</span>
                                    </a>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button className="btn btn-outline-primary mx-2" disabled={page === 1}
                                onClick={onPrevPage}>{t('prev')}</button>
                        <span>{t('page')} {page}</span>
                        <button className="btn btn-outline-primary mx-2" disabled={users.length < limit}
                                onClick={onNextPage}>{t('next')}</button>
                    </div>
                </>
            )}
        </div>
    );
}