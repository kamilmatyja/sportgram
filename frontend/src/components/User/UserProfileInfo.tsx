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
import { getOptionLabel } from '../../utils/options';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { SectionHeader } from '../Common/SectionHeader';

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
                <SectionHeader
                    title={
                        <>
                            <BootstrapIcon name="info-circle" className="me-2" />
                            {t('basicInformation')}
                        </>
                    }
                    actions={
                        (isMyProfile || isAdmin) && (
                            <Button variant="profile-primary" onClick={() => onManageClick(user)}>
                                <BootstrapIcon name="gear" className="me-1" />
                                {t('manage')}
                            </Button>
                        )
                    }
                />

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
                        <Stack className="fw-medium">{getOptionLabel(CountryEnum.getOptions(t), user.country)}</Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('gender')}</Stack>
                        <Stack className="fw-medium">{getOptionLabel(GenderEnum.getOptions(t), user.gender)}</Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('status')}</Stack>
                        <Stack>
                            <EnumBadge options={UserStatusEnum.getOptions(t)} value={user.status} />
                        </Stack>
                    </Col>
                </Row>

                <Stack gap={3} className="mt-4 pt-3 border-top">
                    <Stack>
                        <Stack className="text-muted small mb-2">{t('role')}</Stack>
                        <Stack direction="horizontal" gap={2} className="flex-wrap">
                            {user.roles?.map((r: UserRoleResponse) => (
                                <Badge key={r.id} className="profile-theme-bg">
                                    {getOptionLabel(RoleEnum.getOptions(t), r.role)}
                                </Badge>
                            ))}
                        </Stack>
                    </Stack>
                    <Stack>
                        <Stack className="text-muted small mb-2">{t('discipline')}</Stack>
                        <Stack direction="horizontal" gap={2} className="flex-wrap">
                            {user.disciplines?.map((d: UserDisciplineResponse) => (
                                <EnumBadge key={d.id} options={DisciplineEnum.getOptions(t)} value={d.discipline} />
                            ))}
                        </Stack>
                    </Stack>
                </Stack>
            </Card.Body>
        </Card>
    );
};
