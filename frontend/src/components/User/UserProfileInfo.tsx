import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {CountryEnum} from '../../enums/CountryEnum';
import {GenderEnum} from '../../enums/GenderEnum';
import {UserStatusEnum} from '../../enums/UserStatusEnum';
import {RoleEnum} from '../../enums/RoleEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {getAgeFromDate} from '../../utils/dateFormat';
import {Card, Stack, Row, Col, Badge, Button} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserProfileInfoProps {
    user: UserResponse;
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (user: UserResponse) => void;
}

export const UserProfileInfo: React.FC<UserProfileInfoProps> = ({user, isMyProfile, isAdmin, onManageClick}) => {
    const {t} = useTranslation();

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                    <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
                        <BootstrapIcon name="info-circle" className="me-2" />{t('basicInformation')}
                    </Card.Title>
                    {(isMyProfile || isAdmin) && (
                        <Button variant="profile-primary" onClick={() => onManageClick(user)}>
                            <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                        </Button>
                    )}
                </Stack>

                <Card.Text className="mb-4 text-break">{user.bio || '-'}</Card.Text>

                <Row className="g-3">
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('email')}</Stack>
                        <Stack className="fw-medium text-break">{user.email}</Stack>
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
                        <Stack className="fw-medium">{CountryEnum.getOptions(t).find(opt => String(opt.value) === String(user.country))?.label || user.country}</Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('gender')}</Stack>
                        <Stack className="fw-medium">{GenderEnum.getOptions(t).find(opt => String(opt.value) === String(user.gender))?.label || user.gender}</Stack>
                    </Col>
                    <Col sm={6} md={4}>
                        <Stack className="text-muted small mb-1">{t('status')}</Stack>
                        <Stack>
                            <Badge bg="light" text="dark" className="border profile-theme-border">
                                {UserStatusEnum.getOptions(t).find(opt => String(opt.value) === String(user.status))?.label || user.status}
                            </Badge>
                        </Stack>
                    </Col>
                </Row>

                {user.roles && user.roles.length > 0 && (
                    <Stack className="mt-4 pt-3 border-top">
                        <Stack className="text-muted small mb-2">{t('role')}</Stack>
                        <Stack direction="horizontal" className="flex-wrap gap-2">
                            {user.roles.map((role: any) => (
                                <Badge key={role.id} className="profile-theme-bg">
                                    {RoleEnum.getOptions(t).find(opt => String(opt.value) === String(role.role))?.label || role.role}
                                </Badge>
                            ))}
                        </Stack>
                    </Stack>
                )}

                {user.disciplines && user.disciplines.length > 0 && (
                    <Stack className="mt-3">
                        <Stack className="text-muted small mb-2">{t('discipline')}</Stack>
                        <Stack direction="horizontal" className="flex-wrap gap-2">
                            {user.disciplines.map((disc: any) => (
                                <Badge key={disc.id} bg="light" text="dark" className="border profile-theme-border">
                                    {DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(disc.discipline))?.label || disc.discipline}
                                </Badge>
                            ))}
                        </Stack>
                    </Stack>
                )}
            </Card.Body>
        </Card>
    );
};