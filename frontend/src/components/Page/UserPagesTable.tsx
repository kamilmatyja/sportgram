import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {PageParticipantsTable} from './PageParticipantsTable';
import {PageFollowsTable} from './PageFollowsTable';

interface UserPagesTableProps {
    pages: PageResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (pageObj: PageResponse) => void;
    interactions: any;
}

export const UserPagesTable: React.FC<UserPagesTableProps> = ({
                                                                  pages,
                                                                  relatedUsers,
                                                                  currentUser,
                                                                  isMyProfile,
                                                                  isAdmin,
                                                                  actionLoading,
                                                                  onManageClick,
                                                                  interactions
                                                              }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'participants' | 'follows'>('participants');

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('photo')}</th>
                    <th>{t('title')}</th>
                    <th>{t('link')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th>{t('details')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {pages.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="text-center text-muted">{t('noRecords')}</td>
                    </tr>
                ) : pages.map(pageObj => (
                    <React.Fragment key={pageObj.id}>
                        <tr>
                            <td className="text-center align-middle feed-photo-cell">
                                {pageObj.profilePhoto ? (
                                    <img src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="page"
                                         className="rounded-circle img-fluid feed-photo"/>
                                ) : (
                                    <span className="text-muted">-</span>
                                )}
                            </td>
                            <td>
                                <a href={`/pages/${pageObj.link}`} className="btn btn-link p-0 text-decoration-none">
                                    {pageObj.title}
                                </a>
                            </td>
                            <td>{pageObj.link}</td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}
                                </span>
                            </td>
                            <td>{formatDate(pageObj.createdAt)}</td>
                            <td>
                                <button className="btn btn-sm btn-outline-secondary"
                                        onClick={() => toggleRow(pageObj.id)}>
                                    {expandedRow === pageObj.id ? <i className="bi bi-chevron-up"></i> :
                                        <i className="bi bi-chevron-down"></i>} {t('participants')} / {t('pageFollows')}
                                </button>
                            </td>
                            <td className="text-end">
                                {(isMyProfile || isAdmin) && (
                                    <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')}
                                            onClick={() => onManageClick(pageObj)}>
                                        <i className="bi bi-gear" aria-hidden="true"></i>
                                        <span className="visually-hidden">{t('manage')}</span>
                                    </button>
                                )}
                            </td>
                        </tr>
                        {expandedRow === pageObj.id && (
                            <tr className="bg-light">
                                <td colSpan={7} className="p-3">
                                    <div className="border rounded border-profile-primary bg-white overflow-hidden">
                                        <ul className="nav nav-tabs px-3 pt-2 bg-light border-bottom">
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === 'participants' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                                    onClick={() => setActiveTab('participants')}>
                                                    {t('participants')} ({pageObj.participants?.length || 0})
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button
                                                    className={`nav-link ${activeTab === 'follows' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                                    onClick={() => setActiveTab('follows')}>
                                                    {t('pageFollows')} ({pageObj.follows?.length || 0})
                                                </button>
                                            </li>
                                        </ul>
                                        <div className="p-3">
                                            {activeTab === 'participants' ? (
                                                <PageParticipantsTable
                                                    participants={pageObj.participants || []}
                                                    relatedUsers={relatedUsers}
                                                    currentUser={currentUser}
                                                    actionLoading={actionLoading}
                                                    onUpdateStatus={interactions.handleParticipantStatusSubmit}
                                                />
                                            ) : (
                                                <PageFollowsTable
                                                    follows={pageObj.follows || []}
                                                    relatedUsers={relatedUsers}
                                                    currentUser={currentUser}
                                                    isMyProfile={isMyProfile}
                                                    isAdmin={isAdmin}
                                                    actionLoading={actionLoading}
                                                    onUpdateStatus={interactions.handleFollowStatusSubmit}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
};