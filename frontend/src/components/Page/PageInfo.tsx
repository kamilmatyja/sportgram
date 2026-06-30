import React from 'react';
import { Card, Stack, Badge, Button, Row, Col } from 'react-bootstrap';

import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import BootstrapIcon from '../Common/BootstrapIcon';

interface PageInfoProps {
    pageObj: PageResponse;
    canManage: boolean;
    onManageClick: (page: PageResponse) => void;
}

export const PageInfo: React.FC<PageInfoProps> = ({ pageObj, canManage, onManageClick }) => {
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
                        <Button variant="profile-primary" onClick={() => onManageClick(pageObj)}>
                            <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                        </Button>
                    )}
                </Stack>

                <Card.Title as="h4" className="mb-2 fw-bold">
                    {pageObj.title}
                </Card.Title>
                <Card.Text className="mb-4 text-break fs-5">{pageObj.description}</Card.Text>

                <Row className="g-3 align-items-start pt-3 border-top">
                    <Col md={4}>
                        <Stack>
                            <Stack as="strong" className="small mb-1">
                                {t('status')}:
                            </Stack>
                            <Badge bg="light" text="dark" className="border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find((opt) => opt.value === pageObj.status)?.label ||
                                    pageObj.status}
                            </Badge>
                        </Stack>
                    </Col>
                    <Col md={8} />
                </Row>
            </Card.Body>
        </Card>
    );
};
