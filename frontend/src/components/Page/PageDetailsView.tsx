import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventResponse} from '../../api/responses/EventResponse';
import {PageFollowResponse} from '../../api/responses/PageFollowResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {PageHeader} from './PageHeader';
import {PageInfo} from './PageInfo';
import {PageDetailsParticipantsTable} from './PageDetailsParticipantsTable';
import {PageDetailsFollowsTable} from './PageDetailsFollowsTable';
import {PageEventsTable} from './PageEventsTable';

interface PageDetailsViewProps {
    pageObj: PageResponse | null;
    ownerUser: UserResponse | null;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipantOfPage: boolean;
    myFollow: PageFollowResponse | null;
    followLoading: boolean;
    handleToggleFollow: () => void;
    loading: boolean;
    error: string | null;
    onManageClick: (page: PageResponse) => void;
    interactions: any;

    events: EventResponse[];
    eventsLoading: boolean;
    eventPage: number;
    eventLimit: number;
    eventSort: string;
    eventFilters: EventFilterQuery;
    handleEventFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleEventSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventPrevPage: () => void;
    handleEventNextPage: () => void;
}

export const PageDetailsView: React.FC<PageDetailsViewProps> = ({
                                                                    pageObj,
                                                                    ownerUser,
                                                                    currentUser,
                                                                    relatedUsers,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    isParticipantOfPage,
                                                                    myFollow,
                                                                    followLoading,
                                                                    handleToggleFollow,
                                                                    loading,
                                                                    error,
                                                                    onManageClick,
                                                                    interactions,
                                                                    events,
                                                                    eventsLoading,
                                                                    eventPage,
                                                                    eventLimit,
                                                                    eventSort,
                                                                    eventFilters,
                                                                    handleEventFilterChange,
                                                                    handleEventSortChange,
                                                                    handleEventLimitChange,
                                                                    handleEventPrevPage,
                                                                    handleEventNextPage
                                                                }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border text-profile-primary"/>
    </div>;
    if (error || !pageObj || !ownerUser) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const themeClass = ColorEnum.getClass(pageObj.color);
    const canManage = isMyProfile || isAdmin || isParticipantOfPage;

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`} tabIndex={-1}>
            <PageHeader
                pageObj={pageObj}
            />

            <div className="d-flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
                <a href="/pages" className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('pages')}
                </a>
            </div>

            <PageInfo
                pageObj={pageObj}
                myFollow={myFollow}
                followLoading={followLoading}
                handleToggleFollow={handleToggleFollow}
                canManage={canManage}
                onManageClick={onManageClick}
            />

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="mb-3 text-profile-primary fw-bold">{t('participants')}</h5>
                    <PageDetailsParticipantsTable
                        participants={pageObj.participants || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleParticipantStatusSubmit}
                    />
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="mb-3 text-profile-primary fw-bold">{t('pageFollows')}</h5>
                    <PageDetailsFollowsTable
                        follows={pageObj.follows || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleFollowStatusSubmit}
                    />
                </div>
            </div>

            <PageEventsTable
                events={events}
                eventsLoading={eventsLoading}
                eventPage={eventPage}
                eventLimit={eventLimit}
                eventSort={eventSort}
                eventFilters={eventFilters}
                handleEventFilterChange={handleEventFilterChange}
                handleEventSortChange={handleEventSortChange}
                handleEventLimitChange={handleEventLimitChange}
                handleEventPrevPage={handleEventPrevPage}
                handleEventNextPage={handleEventNextPage}
            />
        </div>
    );
};