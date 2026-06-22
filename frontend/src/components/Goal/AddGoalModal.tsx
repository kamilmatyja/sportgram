import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GoalBody} from '../../api/body/GoalBody';
import {ColorEnum} from '../../enums/ColorEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {Modal, Form, Button, Row, Col, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

interface AddGoalModalProps {
    user: UserResponse | null;
    show: boolean;
    availableUsers: UserResponse[];
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: GoalBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
                                                              user,
                                                              show,
                                                              availableUsers,
                                                              closeModal,
                                                              loading,
                                                              globalError,
                                                              fieldErrors,
                                                              formData,
                                                              handleChange,
                                                              handleParticipantsChange,
                                                              handleSubmit
                                                          }) => {
    const {t} = useTranslation();
    if (!show || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);
    const disciplineOptions = DisciplineEnum.getOptions(t) as SelectOption[];
    const userOptions: SelectOption[] = availableUsers.map(u => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.link})`
    }));

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addGoal')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="add-goal-form" onSubmit={handleSubmit}>
                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

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
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>
                    {t('cancel')}
                </Button>
                <Button variant="profile-primary" type="submit" form="add-goal-form" disabled={loading}>
                    {loading ? t('sending') : t('addGoal')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};