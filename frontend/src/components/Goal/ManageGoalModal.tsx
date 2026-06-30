import React from 'react';
import { Modal, Form, Button, Row, Col, Stack, Badge, Alert } from 'react-bootstrap';

import { GoalBody } from '../../api/body/GoalBody';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

interface ManageGoalModalProps {
    user: UserResponse | null;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    show: boolean;
    goal: GoalResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: GoalBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageGoalModal: React.FC<ManageGoalModalProps> = ({
    user,
    availableUsers,
    handleParticipantsChange,
    show,
    goal,
    isMyProfile,
    isAdmin,
    closeModal,
    loading,
    globalError,
    formData,
    handleChange,
    handleEditSubmit,
    handleStatusSubmit,
    handleDelete,
}) => {
    const { t } = useTranslation();
    if (!show || !goal || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);
    const disciplineOptions = DisciplineEnum.getOptions(t) as SelectOption[];
    const userOptions: SelectOption[] = availableUsers.map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.link})`,
    }));

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                {isMyProfile && (
                    <Form id="edit-goal-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('startedAt')}</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="startedAt"
                                        value={formData.startedAt || ''}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('endedAt')}</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="endedAt"
                                        value={formData.endedAt || ''}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('title')}</Form.Label>
                            <Form.Control
                                type="text"
                                name="text"
                                value={formData.text}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('link')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="link"
                                        value={formData.link}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('discipline')}</Form.Label>
                                    <Form.Select name="discipline" value={formData.discipline} onChange={handleChange}>
                                        <SelectOptions options={disciplineOptions} />
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('distance')} [m]</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="distance"
                                        value={formData.distance}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('time')} [s]</Form.Label>
                            <Form.Control
                                type="number"
                                name="time"
                                value={formData.time || ''}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('participants')}</Form.Label>
                            <Form.Select
                                name="participants"
                                value={formData.participants}
                                onChange={handleParticipantsChange}
                                multiple
                            >
                                <SelectOptions options={userOptions} />
                            </Form.Select>
                        </Form.Group>
                    </Form>
                )}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {GoalStatusEnum.getOptions(t).find((opt) => opt.value === goal.status)?.label || goal.status}
                    </Badge>
                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {GoalStatusEnum.getOptions(t)
                            .filter(
                                (opt) =>
                                    opt.value !== goal.status &&
                                    (isAdmin || (isMyProfile && opt.value !== GoalStatusEnum.REJECTED)),
                            )
                            .map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant="profile-outline-primary"
                                    className="btn-xs py-0 px-2"
                                    onClick={() => handleStatusSubmit(opt.value)}
                                    disabled={loading}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                    </Stack>
                </Stack>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    {t('cancel')}
                </Button>
                {isMyProfile && (
                    <Stack direction="horizontal" gap={2}>
                        <Button variant="danger" onClick={handleDelete} disabled={loading}>
                            {t('delete')}
                        </Button>
                        <Button variant="profile-primary" type="submit" form="edit-goal-form" disabled={loading}>
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                )}
            </Modal.Footer>
        </Modal>
    );
};
