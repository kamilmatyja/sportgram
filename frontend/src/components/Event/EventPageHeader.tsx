import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { PageResponse } from '../../api/responses/PageResponse';
import { EventResponse } from '../../api/responses/EventResponse';

interface EventPageHeaderProps {
    eventObj: EventResponse;
    ownerPage: PageResponse;
    canManage: boolean;
    onManageClick: (eventObj: EventResponse) => void;
}

export const EventPageHeader: React.FC<EventPageHeaderProps> = ({ eventObj, ownerPage, canManage, onManageClick }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className="card shadow-sm mb-4">
                <div className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    {ownerPage.backgroundPhoto && (
                        <img src={`data:image/webp;base64,${ownerPage.backgroundPhoto}`} alt="Background" className="w-100 h-100 object-fit-cover" />
                    )}
                </div>
                <div className="card-body position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                    <div>
                        {ownerPage.profilePhoto ? (
                            <img src={`data:image/webp;base64,${ownerPage.profilePhoto}`} alt="Profile" className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover" />
                        ) : (
                            <div className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar d-flex align-items-center justify-content-center">
                                <i className="bi bi-file-earmark-text fs-1 text-muted"></i>
                            </div>
                        )}
                        <div className="mt-4 mt-md-3">
                            <h2 className="mb-0 profile-theme-text fw-bold">{eventObj.title}</h2>
                            <p className="text-muted mb-0">
                                {t('pageOrganizer')}: <Link to={`/pages/${ownerPage.link}`} className="text-decoration-none text-muted fw-bold">@{ownerPage.link}</Link>
                            </p>
                        </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(eventObj)}>
                                <i className="bi bi-gear me-1"></i> {t('manageEvent')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4 overflow-x-auto">
                <Link to="/events" className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('events')}
                </Link>
            </div>
        </>
    );
};