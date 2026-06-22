import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {UserSubpageHeader} from '../User/UserSubpageHeader';
import {TrainingDetailsParticipantsTable} from './TrainingDetailsParticipantsTable';
import {TrainingDetailsDisciplinesTable} from './TrainingDetailsDisciplinesTable';
import BootstrapIcon from '../Common/BootstrapIcon';
import {Container, Card, Stack, Row, Col, Badge, Button, Spinner, Alert} from 'react-bootstrap';

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
    interactions: any;
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
                                                                            interactions
                                                                        }) => {
    const {t} = useTranslation();

    if (loading) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" className="text-profile-primary" />
        </Container>
    );

    if (error || !training || !ownerUser) return (
        <Container className="mt-5">
            <Alert variant="danger">{error ? t(error) : t('error')}</Alert>
        </Container>
    );

    const themeClass = ColorEnum.getClass(ownerUser.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={ownerUser}/>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                        <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
                            <BootstrapIcon name="info-circle" className="me-2" />{t('basicInformation')}
                        </Card.Title>
                        {canManage && (
                            <Button variant="profile-primary" onClick={() => onManageClick(training)}>
                                <BootstrapIcon name="gear" className="me-1" /> {t('manage')}
                            </Button>
                        )}
                    </Stack>

                    <Stack className="mb-2">
                        <Card.Title as="h4" className="mb-3 fw-bold">{training.title}</Card.Title>
                        <Card.Text className="mb-4 text-break fs-5">{training.description}</Card.Text>

                        <Row className="g-3">
                            <Col sm={6} md={4}>
                                <Stack className="text-muted small mb-1">{t('location')}</Stack>
                                <Stack className="fw-medium" direction="horizontal">
                                    <BootstrapIcon name="geo-alt" className="me-1" /> {training.location}
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
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(training.status))?.label || training.status}
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
                    <TrainingDetailsParticipantsTable
                        participants={training.participants || []}
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
                    <TrainingDetailsDisciplinesTable disciplines={training.disciplines || []}/>
                </Card.Body>
            </Card>
        </Container>
    );
};