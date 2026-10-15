import React from 'react';
import { Container } from 'react-bootstrap';

import { EventBasicInfo } from './EventBasicInfo';
import { EventDisciplinesTable } from './EventDisciplinesTable';
import { EventPageHeader } from './EventPageHeader';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { ColorEnum } from '../../enums/ColorEnum';
import { ErrorView, LoadingView } from '../Common/ViewState';

interface EventDetailsViewProps {
    eventObj: EventResponse | null;
    ownerPage: PageResponse | null;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (eventObj: EventResponse) => void;
    openListsModal: (distId: string) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
    eventObj,
    ownerPage,
    currentUser,
    isMyProfile,
    isAdmin,
    loading,
    error,
    onManageClick,
    openListsModal,
}) => {
    if (loading) return <LoadingView />;

    if (error || !eventObj || !ownerPage || !currentUser) return <ErrorView error={error || 'error'} />;

    const themeClass = ColorEnum.getClass(ownerPage.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <EventPageHeader ownerPage={ownerPage} />
            <EventBasicInfo eventObj={eventObj} canManage={canManage} onManageClick={onManageClick} />
            <EventDisciplinesTable eventObj={eventObj} openListsModal={openListsModal} />
        </Container>
    );
};
