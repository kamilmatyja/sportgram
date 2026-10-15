import React from 'react';
import { Card, Stack, Button, Row, Col } from 'react-bootstrap';

import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { SectionHeader } from '../Common/SectionHeader';

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
                <SectionHeader
                    title={
                        <>
                            <BootstrapIcon name="info-circle" className="me-2" />
                            {t('basicInformation')}
                        </>
                    }
                    actions={
                        canManage && (
                            <Button variant="profile-primary" onClick={() => onManageClick(pageObj)}>
                                <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                            </Button>
                        )
                    }
                />

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
                            <EnumBadge options={ElementStatusEnum.getOptions(t)} value={pageObj.status} />
                        </Stack>
                    </Col>
                    <Col md={8} />
                </Row>
            </Card.Body>
        </Card>
    );
};
