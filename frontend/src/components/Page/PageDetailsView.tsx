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
import {Container, Card, Stack, Spinner, Alert} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import BootstrapIcon from '../Common/BootstrapIcon';

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

    if (loading) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" className="text-profile-primary" />
        </Container>
    );

    if (error || !pageObj || !ownerUser) return (
        <Container className="mt-5">
            <Alert variant="danger">{error ? t(error) : t('error')}</Alert>
        </Container>
    );

    const themeClass = ColorEnum.getClass(pageObj.color);
    const canManage = isMyProfile || isAdmin || isParticipantOfPage;

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`} tabIndex={-1}>
            <PageHeader
                pageObj={pageObj}
            />

            <Stack direction="horizontal" className="flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
                <Link to="/pages" className="btn btn-profile-outline-primary">
                    <BootstrapIcon name="arrow-left" className="me-1" /> {t('pages')}
                </Link>
            </Stack>

            <PageInfo
                pageObj={pageObj}
                myFollow={myFollow}
                followLoading={followLoading}
                handleToggleFollow={handleToggleFollow}
                canManage={canManage}
                onManageClick={onManageClick}
            />

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">{t('participants')}</Card.Title>
                    <PageDetailsParticipantsTable
                        participants={pageObj.participants || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleParticipantStatusSubmit}
                    />
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">{t('pageFollows')}</Card.Title>
                    <PageDetailsFollowsTable
                        follows={pageObj.follows || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleFollowStatusSubmit}
                    />
                </Card.Body>
            </Card>

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
        </Container>
    );
};