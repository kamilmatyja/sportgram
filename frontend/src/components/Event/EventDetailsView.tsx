import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {EventPageHeader} from './EventPageHeader';
import {EventBasicInfo} from './EventBasicInfo';
import {EventDisciplinesTable} from './EventDisciplinesTable';

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
                                                                      openListsModal
                                                                  }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border text-profile-primary"/>
    </div>;
    if (error || !eventObj || !ownerPage || !currentUser) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const themeClass = ColorEnum.getClass(ownerPage.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`} tabIndex={-1}>
            <EventPageHeader
                ownerPage={ownerPage}
            />

            <EventBasicInfo
                eventObj={eventObj}
                canManage={canManage}
                onManageClick={onManageClick}
            />

            <EventDisciplinesTable
                eventObj={eventObj}
                openListsModal={openListsModal}
            />
        </div>
    );
};