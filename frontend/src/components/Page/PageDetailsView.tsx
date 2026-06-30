import React from 'react';
import { Container, Card, Stack, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { PageDetailsFollowsTable } from './PageDetailsFollowsTable';
import { PageDetailsParticipantsTable } from './PageDetailsParticipantsTable';
import { PageEventsTable } from './PageEventsTable';
import { PageHeader } from './PageHeader';
import { PageInfo } from './PageInfo';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageFollowResponse } from '../../api/responses/PageFollowResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
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
    handleEventFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleEventSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventPrevPage: () => void;
    handleEventNextPage: () => void;
}

export const PageDetailsView: React.FC<PageDetailsViewProps> = (props) => {
    const { t } = useTranslation();
    const { pageObj, ownerUser, loading, error, onManageClick } = props;

    if (loading)
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    if (error || !pageObj || !ownerUser)
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error ? t(error) : t('error')}</Alert>
            </Container>
        );

    const themeClass = ColorEnum.getClass(pageObj.color);
    const canManage = props.isMyProfile || props.isAdmin || props.isParticipantOfPage;

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <PageHeader
                pageObj={pageObj}
                isFollowing={props.myFollow?.status === PageFollowStatusEnum.ACCEPTED}
                followLoading={props.followLoading}
                handleToggleFollow={props.handleToggleFollow}
            />

            <Stack direction="horizontal" className="mb-4">
                <Link to="/pages" className="btn btn-profile-outline-primary">
                    <BootstrapIcon name="arrow-left" className="me-1" /> {t('pages')}
                </Link>
            </Stack>

            <PageInfo pageObj={pageObj} canManage={canManage} onManageClick={onManageClick} />

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">
                        {t('participants')}
                    </Card.Title>
                    <PageDetailsParticipantsTable
                        participants={pageObj.participants || []}
                        relatedUsers={props.relatedUsers}
                        canManage={canManage}
                        actionLoading={props.interactions.actionLoading}
                        onUpdateStatus={props.interactions.handleParticipantStatusSubmit}
                    />
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">
                        {t('pageFollows')}
                    </Card.Title>
                    <PageDetailsFollowsTable
                        follows={pageObj.follows || []}
                        relatedUsers={props.relatedUsers}
                        currentUser={props.currentUser}
                        actionLoading={props.interactions.actionLoading}
                        onUpdateStatus={props.interactions.handleFollowStatusSubmit}
                    />
                </Card.Body>
            </Card>

            <PageEventsTable {...props} paginationVariant="profile-outline-primary" />
        </Container>
    );
};
