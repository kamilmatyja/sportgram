import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {GoalStatusEnum} from '../../enums/GoalStatusEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {formatDate} from '../../utils/dateFormat';
import {UserSubpageHeader} from '../User/UserSubpageHeader';
import {GoalDetailsParticipantsTable} from './GoalDetailsParticipantsTable';
import {GoalDetailsResultsTable} from './GoalDetailsResultsTable';
import BootstrapIcon from '../Common/BootstrapIcon';
import {Container, Card, Stack, Row, Col, Badge, Button, Spinner, Alert} from 'react-bootstrap';

interface GoalDetailsViewProps {
    goal: GoalResponse | null;
    ownerUser: UserResponse | null;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (goal: GoalResponse) => void;
    interactions: any;
}

export const GoalDetailsView: React.FC<GoalDetailsViewProps> = ({
                                                                    goal,
                                                                    ownerUser,
                                                                    currentUser,
                                                                    relatedUsers,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    loading,
                                                                    error,
                                                                    onManageClick,
                                                                    interactions
                                                                }) => {
    const {t} = useTranslation();

    if (loading) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" className="text-profile-primary" />
        </Container>
    );

    if (error || !goal || !ownerUser) return (
        <Container className="mt-5">
            <Alert variant="danger">{error ? t(error) : t('error')}</Alert>
        </Container>
    );

    const themeClass = ColorEnum.getClass(ownerUser.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={ownerUser} />

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                        <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
                            <BootstrapIcon name="info-circle" className="me-2" />{t('basicInformation')}
                        </Card.Title>
                        {canManage && (
                            <Button variant="profile-primary" onClick={() => onManageClick(goal)}>
                                <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                            </Button>
                        )}
                    </Stack>

                    <Stack className="mb-2">
                        <Card.Text className="mb-4 text-break fs-5">{goal.text}</Card.Text>

                        <Row className="g-3">
                            <Col sm={6} md={4}>
                                <Stack className="text-muted small mb-1">{t('discipline')}</Stack>
                                <Stack className="fw-medium">
                                    {DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}
                                </Stack>
                            </Col>
                            <Col sm={6} md={4}>
                                <Stack className="text-muted small mb-1">{t('distance')}</Stack>
                                <Stack className="fw-medium">{goal.distance} [m]</Stack>
                            </Col>
                            <Col sm={6} md={4}>
                                <Stack className="text-muted small mb-1">{t('time')}</Stack>
                                <Stack className="fw-medium">{goal.time ? `${goal.time} [s]` : '-'}</Stack>
                            </Col>
                            <Col sm={6} md={4}>
                                <Stack className="text-muted small mb-1">{t('startedAt')}</Stack>
                                <Stack className="fw-medium">{goal.startedAt ? formatDate(goal.startedAt) : '-'}</Stack>
                            </Col>
                            <Col sm={6} md={4}>
                                <Stack className="text-muted small mb-1">{t('endedAt')}</Stack>
                                <Stack className="fw-medium">{goal.endedAt ? formatDate(goal.endedAt) : '-'}</Stack>
                            </Col>
                            <Col sm={6} md={4}>
                                <Stack className="text-muted small mb-1">{t('status')}</Stack>
                                <Stack>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                                    </Badge>
                                </Stack>
                            </Col>
                        </Row>
                    </Stack>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">{t('participants')}</Card.Title>
                    <GoalDetailsParticipantsTable
                        participants={goal.participants || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleParticipantStatusSubmit}
                    />
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">{t('results')}</Card.Title>
                    <GoalDetailsResultsTable
                        participants={goal.participants || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleResultStatusSubmit}
                    />
                </Card.Body>
            </Card>
        </Container>
    );
};