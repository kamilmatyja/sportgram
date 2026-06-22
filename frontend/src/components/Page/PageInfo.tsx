import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import {PageFollowResponse} from '../../api/responses/PageFollowResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {PageFollowStatusEnum} from '../../enums/PageFollowStatusEnum';
import {Card, Stack, Badge, Button, Spinner} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface PageInfoProps {
    pageObj: PageResponse;
    myFollow: PageFollowResponse | null;
    followLoading: boolean;
    handleToggleFollow: () => void;
    canManage: boolean;
    onManageClick: (page: PageResponse) => void;
}

export const PageInfo: React.FC<PageInfoProps> = ({
                                                      pageObj,
                                                      myFollow,
                                                      followLoading,
                                                      handleToggleFollow,
                                                      canManage,
                                                      onManageClick
                                                  }) => {
    const {t} = useTranslation();

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                    <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
                        <BootstrapIcon name="info-circle" className="me-2" />{t('basicInformation')}
                    </Card.Title>
                    {canManage && (
                        <Button variant="profile-primary" onClick={() => onManageClick(pageObj)}>
                            <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                        </Button>
                    )}
                </Stack>

                <Card.Title as="h4" className="mb-3 fw-bold">{pageObj.title}</Card.Title>
                <Card.Text as="p" className="mb-4 text-break fs-5">{pageObj.description}</Card.Text>

                <Stack direction="horizontal" gap={2} className="align-items-center mt-2 mb-4">
                    <Stack as="strong">{t('status')}: </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}
                    </Badge>
                </Stack>

                <Stack direction="horizontal" gap={2} className="align-items-center mt-3 pt-3 border-top">
                    <Button
                        variant={myFollow?.status === PageFollowStatusEnum.ACCEPTED ? 'outline-danger' : 'profile-primary'}
                        size="sm"
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                    >
                        {followLoading ? (
                            <Spinner animation="border" size="sm" />
                        ) : myFollow?.status === PageFollowStatusEnum.ACCEPTED ? (
                            <><BootstrapIcon name="dash-circle" className="me-1" /> {t('unfollowPage')}</>
                        ) : (
                            <><BootstrapIcon name="plus-circle" className="me-1" /> {t('followPage')}</>
                        )}
                    </Button>
                </Stack>
            </Card.Body>
        </Card>
    );
};