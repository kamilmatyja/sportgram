import React from 'react';
import { Card, Stack, Row, Col, Badge, Button } from 'react-bootstrap';

import { UserDisciplineResponse } from '../../api/responses/UserDisciplineResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { UserRoleResponse } from '../../api/responses/UserRoleResponse';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { getAgeFromDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserProfileInfoProps {
    user: UserResponse;
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (user: UserResponse) => void;
}

export const UserProfileInfo: React.FC<UserProfileInfoProps> = ({ user, isMyProfile, isAdmin, onManageClick }) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                    <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
                        <BootstrapIcon name="info-circle" className="me-2" />
                        {t('basicInformation')}
                    </Card.Title>
                    {(isMyProfile || isAdmin) && (
                        <Button variant="profile-primary" onClick={() => onManageClick(user)}>
                            <BootstrapIcon name="gear" className="me-1" />
                            {t('manage')}
                        </Button>
                    )}
                </Stack>

                <Card.Text className="mb-4 text-break fs-5">{user.bio || '-'}</Card.Text>

                <Row className="g-3 border-top pt-4">
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('email')}</Stack>
                        <Stack className="fw-medium">{user.email}</Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('phone')}</Stack>
                        <Stack className="fw-medium">{user.phone}</Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('age')}</Stack>
                        <Stack className="fw-medium">{getAgeFromDate(user.birthAt)}</Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('country')}</Stack>
                        <Stack className="fw-medium">
                            {CountryEnum.getOptions(t).find((o) => o.value === user.country)?.label || user.country}
                        </Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('gender')}</Stack>
                        <Stack className="fw-medium">
                            {GenderEnum.getOptions(t).find((o) => o.value === user.gender)?.label || user.gender}
                        </Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('status')}</Stack>
                        <Stack>
                            <Badge bg="light" text="dark" className="border profile-theme-border">
                                {UserStatusEnum.getOptions(t).find((o) => o.value === user.status)?.label ||
                                    user.status}
                            </Badge>
                        </Stack>
                    </Col>
                </Row>

                <Stack gap={3} className="mt-4 pt-3 border-top">
                    <Stack>
                        <Stack className="text-muted small mb-2">{t('role')}</Stack>
                        <Stack direction="horizontal" gap={2} className="flex-wrap">
                            {user.roles?.map((r: UserRoleResponse) => (
                                <Badge key={r.id} className="profile-theme-bg">
                                    {RoleEnum.getOptions(t).find((o) => o.value === r.role)?.label || r.role}
                                </Badge>
                            ))}
                        </Stack>
                    </Stack>
                    <Stack>
                        <Stack className="text-muted small mb-2">{t('discipline')}</Stack>
                        <Stack direction="horizontal" gap={2} className="flex-wrap">
                            {user.disciplines?.map((d: UserDisciplineResponse) => (
                                <Badge key={d.id} bg="light" text="dark" className="border profile-theme-border">
                                    {DisciplineEnum.getOptions(t).find((o) => o.value === d.discipline)?.label ||
                                        d.discipline}
                                </Badge>
                            ))}
                        </Stack>
                    </Stack>
                </Stack>
            </Card.Body>
        </Card>
    );
};
