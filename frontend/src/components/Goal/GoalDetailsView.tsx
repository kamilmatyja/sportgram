import React from 'react';
import { Container, Card, Stack, Row, Col, Button } from 'react-bootstrap';

import { GoalDetailsResultsTable } from './GoalDetailsResultsTable';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type GoalInteractions } from '../../services/Goal/useGoalInteractions';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { getOptionLabel } from '../../utils/options';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { FormErrorAlert } from '../Common/FormFields';
import { ParticipantsTable } from '../Common/ParticipantsTable';
import { SectionHeader } from '../Common/SectionHeader';
import { canChangeOwnStatus } from '../Common/statusPermissions';
import { ErrorView, LoadingView } from '../Common/ViewState';
import { UserSubpageHeader } from '../User/UserSubpageHeader';

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
    interactions: GoalInteractions;
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
    interactions,
}) => {
    const { t } = useTranslation();

    if (loading) return <LoadingView />;
    if (error || !goal || !ownerUser) return <ErrorView error={error || 'error'} />;

    const themeClass = ColorEnum.getClass(ownerUser.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={ownerUser} />
            <FormErrorAlert error={interactions.actionError} />

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
                                <Button variant="profile-primary" onClick={() => onManageClick(goal)}>
                                    <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                                </Button>
                            )
                        }
                    />

                    <Card.Text className="mb-4 text-break fs-5">{goal.text}</Card.Text>

                    <Row className="g-3 border-top pt-4">
                        <Col sm={6} md={4}>
                            <Stack className="text-muted small mb-1">{t('discipline')}</Stack>
                            <Stack className="fw-medium">
                                {getOptionLabel(DisciplineEnum.getOptions(t), goal.discipline)}
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
                                <EnumBadge options={GoalStatusEnum.getOptions(t)} value={goal.status} />
                            </Stack>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">
                        {t('participants')}
                    </Card.Title>
                    <ParticipantsTable
                        participants={goal.participants || []}
                        relatedUsers={relatedUsers}
                        canManage={canChangeOwnStatus(currentUser)}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleParticipantStatusSubmit}
                    />
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">
                        {t('results')}
                    </Card.Title>
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
