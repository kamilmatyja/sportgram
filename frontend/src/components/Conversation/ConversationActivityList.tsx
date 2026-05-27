import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { ProcessedActivity } from '../../services/useUserConversations';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { formatDate } from '../../utils/dateFormat';

interface ConversationActivityListProps {
    activities: ProcessedActivity[];
    totalActivities: number;
    activityPage: number;
    activityLimit: number;
    activitySort: string;
    activitySearch: string;
    loading: boolean;
    setActivityPage: (page: number) => void;
    setActivityLimit: (limit: number) => void;
    setActivitySort: (sort: string) => void;
    setActivitySearch: (search: string) => void;
}

export const ConversationActivityList: React.FC<ConversationActivityListProps> = ({
                                                                                      activities,
                                                                                      totalActivities,
                                                                                      activityPage,
                                                                                      activityLimit,
                                                                                      activitySort,
                                                                                      activitySearch,
                                                                                      loading,
                                                                                      setActivityPage,
                                                                                      setActivityLimit,
                                                                                      setActivitySort,
                                                                                      setActivitySearch
                                                                                  }) => {
    const { t } = useTranslation();

    return (
        <div className="card shadow-sm">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 text-profile-primary fw-bold">{t('conversations')}</h4>
                </div>

                <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={activitySearch}
                        onChange={e => {
                            setActivitySearch(e.target.value);
                            setActivityPage(1);
                        }}
                        className="form-control w-auto"
                    />
                    <select value={activitySort} onChange={e => {
                        setActivitySort(e.target.value);
                        setActivityPage(1);
                    }} className="form-select w-auto ms-auto">
                        <option value="updatedAt:desc">{t('sortCreatedDesc')}</option>
                        <option value="updatedAt:asc">{t('sortCreatedAsc')}</option>
                        <option value="user:asc">{t('sortUserAsc')}</option>
                        <option value="user:desc">{t('sortUserDesc')}</option>
                    </select>
                    <select value={activityLimit} onChange={e => {
                        setActivityLimit(Number(e.target.value));
                        setActivityPage(1);
                    }} className="form-select w-auto">
                        {PaginationEnum.getOptions(t).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="text-center my-4">
                        <div className="spinner-border text-profile-primary" />
                    </div>
                ) : (
                    <>
                        <div className="table-responsive-custom mb-3">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-light">
                                <tr>
                                    <th>{t('photo')}</th>
                                    <th>{t('user')}</th>
                                    <th>{t('link')}</th>
                                    <th>{t('lastActivity')}</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted">{t('noConversations')}</td>
                                    </tr>
                                ) : activities.map(act => (
                                    <tr key={act.otherUser.id}>
                                        <td className="text-center align-middle feed-photo-cell">
                                            {act.otherUser.profilePhoto ? (
                                                <img src={`data:image/webp;base64,${act.otherUser.profilePhoto}`} alt="avatar" className="rounded-circle img-fluid feed-photo" />
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <a href={`/users/${act.otherUser.link}`} className="btn btn-link p-0 text-decoration-none">
                                                {act.otherUser.firstName} {act.otherUser.lastName}
                                            </a>
                                        </td>
                                        <td>@{act.otherUser.link}</td>
                                        <td>{formatDate(act.updatedAt)}</td>
                                        <td className="text-end">
                                            <a href={`/users/${act.otherUser.link}/conversations`} title={t('chat')} className="btn btn-sm btn-profile-outline-primary">
                                                <i className="bi bi-chat-dots me-1"></i>
                                                <span className="visually-hidden">{t('chat')}</span>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                            <button className="btn btn-profile-outline-primary mx-2" disabled={activityPage === 1} onClick={() => setActivityPage(Math.max(activityPage - 1, 1))}>
                                {t('prev')}
                            </button>
                            <span>{t('page')} {activityPage}</span>
                            <button className="btn btn-profile-outline-primary mx-2" disabled={activityPage * activityLimit >= totalActivities} onClick={() => setActivityPage(activityPage + 1)}>
                                {t('next')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};