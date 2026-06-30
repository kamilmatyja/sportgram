import React from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';

import { EventBasicInfo } from './EventBasicInfo';
import { EventDisciplinesTable } from './EventDisciplinesTable';
import { EventPageHeader } from './EventPageHeader';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';

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
    const { t } = useTranslation();

    if (loading)
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" className="text-profile-primary" />
            </Container>
        );

    if (error || !eventObj || !ownerPage || !currentUser)
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error ? t(error) : t('error')}</Alert>
            </Container>
        );

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
