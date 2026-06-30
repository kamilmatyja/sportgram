import React from 'react';
import { Card, Stack, Button, Image, Row, Col, Badge } from 'react-bootstrap';

import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';

interface EventBasicInfoProps {
    eventObj: EventResponse;
    canManage: boolean;
    onManageClick: (eventObj: EventResponse) => void;
}

export const EventBasicInfo: React.FC<EventBasicInfoProps> = ({ eventObj, canManage, onManageClick }) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                    <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
                        <BootstrapIcon name="info-circle" className="me-2" />
                        {t('basicInformation')}
                    </Card.Title>
                    {canManage && (
                        <Button variant="profile-primary" onClick={() => onManageClick(eventObj)}>
                            <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                        </Button>
                    )}
                </Stack>

                <Card.Title as="h3" className="mb-3 fw-bold">
                    {eventObj.title}
                </Card.Title>
                <Card.Text className="mb-4 text-break fs-5">{eventObj.description}</Card.Text>

                <Stack className="text-center mb-4">
                    {eventObj.photo && (
                        <Image
                            src={`data:image/webp;base64,${eventObj.photo}`}
                            alt={t('photo')}
                            fluid
                            rounded
                            className="event-details-photo shadow-sm"
                        />
                    )}
                </Stack>

                <Row className="g-3 mb-4 border-bottom pb-4">
                    <Col md={6}>
                        <Stack className="text-muted small mb-1">{t('location')}</Stack>
                        <Stack direction="horizontal" className="fw-medium">
                            <BootstrapIcon name="geo-alt" className="me-1 text-profile-primary" /> {eventObj.location}
                        </Stack>
                    </Col>
                    <Col md={6}>
                        <Stack className="text-muted small mb-1">{t('status')}</Stack>
                        <Stack>
                            <Badge bg="light" text="dark" className="border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(
                                    (opt) => String(opt.value) === String(eventObj.status),
                                )?.label || eventObj.status}
                            </Badge>
                        </Stack>
                    </Col>
                    <Col md={6}>
                        <Stack className="text-muted small mb-1">{t('startedAt')}</Stack>
                        <Stack as="span" className="fw-medium">
                            {formatDate(eventObj.startedAt)}
                        </Stack>
                    </Col>
                    <Col md={6}>
                        <Stack className="text-muted small mb-1">{t('endedAt')}</Stack>
                        <Stack as="span" className="fw-medium">
                            {formatDate(eventObj.endedAt)}
                        </Stack>
                    </Col>
                </Row>

                <Stack className="mb-2">
                    <Card.Title as="h5" className="fw-bold">
                        {t('rules')}
                    </Card.Title>
                    <Card.Text className="text-break mb-0">{eventObj.rules}</Card.Text>
                </Stack>
            </Card.Body>
        </Card>
    );
};
