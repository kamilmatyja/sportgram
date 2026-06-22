import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GoalBody} from '../../api/body/GoalBody';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {GoalStatusEnum} from '../../enums/GoalStatusEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {Modal, Form, Button, Row, Col, Stack, Badge, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

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
                                                                    fieldErrors,
                                                                    formData,
                                                                    handleChange,
                                                                    handleEditSubmit,
                                                                    handleStatusSubmit,
                                                                    handleDelete
                                                                }) => {
    const {t} = useTranslation();
    if (!show || !goal || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);
    const disciplineOptions = DisciplineEnum.getOptions(t) as SelectOption[];
    const userOptions: SelectOption[] = availableUsers.map(u => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.link})`
    }));

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                {isMyProfile && (
                    <Form id="edit-goal-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-3">
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('startedAt')}</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="startedAt"
                                        value={formData.startedAt || ''}
                                        onChange={handleChange}
                                        isInvalid={!!fieldErrors.startedAt}
                                    />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.startedAt}</Form.Control.Feedback>
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
                                        isInvalid={!!fieldErrors.endedAt}
                                    />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.endedAt}</Form.Control.Feedback>
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
                                isInvalid={!!fieldErrors.text}
                                required
                            />
                            <Form.Control.Feedback type="invalid">{fieldErrors.text}</Form.Control.Feedback>
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
                                        isInvalid={!!fieldErrors.link}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.link}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('discipline')}</Form.Label>
                                    <Form.Select
                                        name="discipline"
                                        value={formData.discipline || ''}
                                        onChange={handleChange}
                                        isInvalid={!!fieldErrors.discipline}
                                        required
                                    >
                                        <SelectOptions options={disciplineOptions} placeholder={t('selectOption')} />
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{fieldErrors.discipline}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('distance')} [m]</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="distance"
                                        value={formData.distance || ''}
                                        onChange={handleChange}
                                        isInvalid={!!fieldErrors.distance}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.distance}</Form.Control.Feedback>
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
                                isInvalid={!!fieldErrors.time}
                            />
                            <Form.Control.Feedback type="invalid">{fieldErrors.time}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('participants')}</Form.Label>
                            <Form.Select
                                name="participants"
                                value={Array.isArray(formData.participants) ? formData.participants : []}
                                onChange={handleParticipantsChange}
                                multiple
                                isInvalid={!!fieldErrors.participants}
                            >
                                <SelectOptions options={userOptions} />
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{fieldErrors.participants}</Form.Control.Feedback>
                        </Form.Group>
                    </Form>
                )}

                {(isMyProfile || isAdmin) && (
                    <Stack className="mb-2">
                        <Stack direction="horizontal" className="flex-wrap gap-2 align-items-center">
                            <Stack as="strong">{t('status')}: </Stack>
                            <Badge bg="light" text="dark" className="border profile-theme-border">
                                {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                            </Badge>
                            {GoalStatusEnum.getOptions(t)
                                .filter(opt => opt.value !== goal.status)
                                .filter(opt => isAdmin || (isMyProfile && opt.value !== GoalStatusEnum.REJECTED))
                                .map(opt => (
                                    <Button
                                        key={opt.value}
                                        variant="profile-outline-primary"
                                        size="sm"
                                        className="py-0 px-2 btn-xs"
                                        disabled={loading}
                                        onClick={() => handleStatusSubmit(opt.value)}
                                    >
                                        {loading ? t('loading') : opt.label}
                                    </Button>
                                ))}
                        </Stack>
                    </Stack>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>
                    {t('cancel')}
                </Button>
                {isMyProfile && (
                    <>
                        <Button variant="danger" onClick={handleDelete} disabled={loading}>
                            {loading ? t('sending') : t('delete')}
                        </Button>
                        <Button variant="profile-primary" type="submit" form="edit-goal-form" disabled={loading}>
                            {loading ? t('sending') : t('saveChanges')}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};