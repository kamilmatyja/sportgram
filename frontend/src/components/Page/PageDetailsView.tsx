import React from 'react';
import { Container, Card, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { PageEventsTable } from './PageEventsTable';
import { PageFollowsTable } from './PageFollowsTable';
import { PageHeader } from './PageHeader';
import { PageInfo } from './PageInfo';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageFollowResponse } from '../../api/responses/PageFollowResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type PageInteractions } from '../../services/Page/usePageInteractions';
import { ColorEnum } from '../../enums/ColorEnum';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import { FormErrorAlert } from '../Common/FormFields';
import { ParticipantsTable } from '../Common/ParticipantsTable';
import { canChangeOwnStatus } from '../Common/statusPermissions';
import { ErrorView, LoadingView } from '../Common/ViewState';

interface PageDetailsViewProps {
    pageObj: PageResponse | null;
    ownerUser: UserResponse | null;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    myFollow: PageFollowResponse | null;
    followLoading: boolean;
    handleToggleFollow: () => void;
    loading: boolean;
    error: string | null;
    onManageClick: (page: PageResponse) => void;
    interactions: PageInteractions;
    events: EventResponse[];
    eventsLoading: boolean;
    eventPage: number;
    eventHasMore: boolean;
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

    if (loading) return <LoadingView />;
    if (error || !pageObj || !ownerUser) return <ErrorView error={error || 'error'} />;

    const themeClass = ColorEnum.getClass(pageObj.color);
    const canManage = props.isMyProfile || props.isAdmin;
    const canChangeStatus = canChangeOwnStatus(props.currentUser);

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

            <FormErrorAlert error={props.interactions.actionError} />

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">
                        {t('participants')}
                    </Card.Title>
                    <ParticipantsTable
                        participants={pageObj.participants || []}
                        relatedUsers={props.relatedUsers}
                        canManage={canChangeStatus}
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
                    <PageFollowsTable
                        follows={pageObj.follows || []}
                        relatedUsers={props.relatedUsers}
                        canManage={canChangeStatus}
                        actionLoading={props.interactions.actionLoading}
                        onUpdateStatus={props.interactions.handleFollowStatusSubmit}
                    />
                </Card.Body>
            </Card>

            <PageEventsTable {...props} paginationVariant="profile-outline-primary" />
        </Container>
    );
};
