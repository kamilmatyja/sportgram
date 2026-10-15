import React from 'react';
import { Container, Card, Stack, Row, Col, Button } from 'react-bootstrap';

import { TrainingDetailsDisciplinesTable } from './TrainingDetailsDisciplinesTable';
import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type TrainingInteractions } from '../../services/Training/useTrainingInteractions';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { FormErrorAlert } from '../Common/FormFields';
import { ParticipantsTable } from '../Common/ParticipantsTable';
import { SectionHeader } from '../Common/SectionHeader';
import { canChangeOwnStatus } from '../Common/statusPermissions';
import { ErrorView, LoadingView } from '../Common/ViewState';
import { UserSubpageHeader } from '../User/UserSubpageHeader';

interface TrainingDetailsViewProps {
    training: TrainingResponse | null;
    ownerUser: UserResponse | null;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (training: TrainingResponse) => void;
    interactions: TrainingInteractions;
}

export const TrainingDetailsView: React.FC<TrainingDetailsViewProps> = ({
    training,
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
    if (error || !training || !ownerUser) return <ErrorView error={error || 'error'} />;

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
                                <Button variant="profile-primary" onClick={() => onManageClick(training)}>
                                    <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                                </Button>
                            )
                        }
                    />

                    <Card.Title as="h4" className="mb-3 fw-bold">
                        {training.title}
                    </Card.Title>
                    <Card.Text className="mb-4 text-break fs-5">{training.description}</Card.Text>

                    <Row className="g-3 border-top pt-4">
                        <Col sm={6} md={4}>
                            <Stack className="text-muted small mb-1">{t('location')}</Stack>
                            <Stack direction="horizontal" gap={1} className="fw-medium">
                                <BootstrapIcon name="geo-alt" className="text-profile-primary" />
                                {training.location}
                            </Stack>
                        </Col>
                        <Col sm={6} md={4}>
                            <Stack className="text-muted small mb-1">{t('startedAt')}</Stack>
                            <Stack className="fw-medium">{formatDate(training.startedAt)}</Stack>
                        </Col>
                        <Col sm={6} md={4}>
                            <Stack className="text-muted small mb-1">{t('endedAt')}</Stack>
                            <Stack className="fw-medium">{formatDate(training.endedAt)}</Stack>
                        </Col>
                        <Col sm={6} md={4}>
                            <Stack className="text-muted small mb-1">{t('status')}</Stack>
                            <Stack>
                                <EnumBadge options={ElementStatusEnum.getOptions(t)} value={training.status} />
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
                        participants={training.participants || []}
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
                    <TrainingDetailsDisciplinesTable disciplines={training.disciplines || []} />
                </Card.Body>
            </Card>
        </Container>
    );
};
