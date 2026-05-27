import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { EventResponse } from '../../api/responses/EventResponse';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface EventBasicInfoProps {
    eventObj: EventResponse;
}

export const EventBasicInfo: React.FC<EventBasicInfoProps> = ({ eventObj }) => {
    const { t } = useTranslation();

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <h4 className="mb-4 text-profile-primary fw-bold">
                    <i className="bi bi-info-circle me-2"></i>{t('basicInformation')}
                </h4>

                <div className="text-center mb-4">
                    {eventObj.photo && (
                        <img src={`data:image/webp;base64,${eventObj.photo}`} alt="Event photo" className="img-fluid rounded shadow-sm event-details-photo" />
                    )}
                </div>

                <div className="row g-3 mb-4 border-bottom pb-4">
                    <div className="col-md-6">
                        <div className="text-muted small mb-1">{t('location')}</div>
                        <div className="fw-medium">
                            <i className="bi bi-geo-alt me-1 text-profile-primary"></i> {eventObj.location}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="text-muted small mb-1">{t('eventStatus')}</div>
                        <div>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(eventObj.status))?.label || eventObj.status}
                            </span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="text-muted small mb-1">{t('startedAt')}</div>
                        <div className="fw-medium">{formatDate(eventObj.startedAt)}</div>
                    </div>
                    <div className="col-md-6">
                        <div className="text-muted small mb-1">{t('endedAt')}</div>
                        <div className="fw-medium">{formatDate(eventObj.endedAt)}</div>
                    </div>
                </div>

                <div className="mb-4 border-bottom pb-4">
                    <h5 className="fw-bold">{t('description')}</h5>
                    <p className="text-break mb-0">{eventObj.description}</p>
                </div>

                <div className="mb-2">
                    <h5 className="fw-bold">{t('rules')}</h5>
                    <p className="text-break mb-0">{eventObj.rules}</p>
                </div>
            </div>
        </div>
    );
};