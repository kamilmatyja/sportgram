import React from 'react';
import { Modal, Form, Button, Row, Col, InputGroup, Stack, Card, Alert } from 'react-bootstrap';

import { TrainingBody } from '../../api/body/TrainingBody';
import { TrainingDistance } from '../../api/body/TrainingDistance';
import { TrainingSubDistance } from '../../api/body/TrainingSubDistance';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

interface AddTrainingModalProps {
    user: UserResponse | null;
    show: boolean;
    availableUsers: UserResponse[];
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: TrainingBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    addDiscipline: () => void;
    updateDisciplineType: (index: number, type: number) => void;
    removeDiscipline: (index: number) => void;
    addDistance: (discIndex: number) => void;
    updateDistanceValue: (discIndex: number, distIndex: number, field: keyof TrainingDistance, val: number) => void;
    removeDistance: (discIndex: number, distIndex: number) => void;
    addSubDistance: (discIndex: number, distIndex: number) => void;
    updateSubDistanceValue: (
        discIndex: number,
        distIndex: number,
        subIndex: number,
        field: keyof TrainingSubDistance,
        val: number,
    ) => void;
    removeSubDistance: (discIndex: number, distIndex: number, subIndex: number) => void;
}

export const AddTrainingModal: React.FC<AddTrainingModalProps> = ({
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
    handleSubmit,
    addDiscipline,
    updateDisciplineType,
    removeDiscipline,
    addDistance,
    updateDistanceValue,
    removeDistance,
    addSubDistance,
    updateSubDistanceValue,
    removeSubDistance,
}) => {
    const { t } = useTranslation();
    if (!show || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);
    const disciplineOptions = DisciplineEnum.getOptions(t) as SelectOption[];
    const userOptions: SelectOption[] = availableUsers.map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.link})`,
    }));

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addTraining')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="add-training-form" onSubmit={handleSubmit}>
                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('startedAt')}</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    name="startedAt"
                                    value={formData.startedAt}
                                    onChange={handleChange}
                                    isInvalid={!!fieldErrors.startedAt}
                                    required
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
                                    value={formData.endedAt}
                                    onChange={handleChange}
                                    isInvalid={!!fieldErrors.endedAt}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">{fieldErrors.endedAt}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('title')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    isInvalid={!!fieldErrors.title}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">{fieldErrors.title}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
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
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('location')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.location}
                            required
                        />
                        <Form.Control.Feedback type="invalid">{fieldErrors.location}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('description')}</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.description}
                            required
                            rows={3}
                        />
                        <Form.Control.Feedback type="invalid">{fieldErrors.description}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
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

                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-3">
                        <Card.Title as="h6" className="text-profile-primary mb-0 fw-bold">
                            {t('disciplinesAndDistances')}
                        </Card.Title>
                        <Button variant="profile-outline-primary" size="sm" onClick={addDiscipline}>
                            {t('add')}
                        </Button>
                    </Stack>

                    {formData.disciplines?.map((disc, dIdx) => (
                        <Card key={dIdx} className="mb-3">
                            <Card.Body>
                                <Stack direction="horizontal" gap={3} className="mb-3 align-items-end">
                                    <Stack className="flex-grow-1">
                                        <Form.Label className="small">{t('discipline')}</Form.Label>
                                        <Form.Select
                                            value={disc.discipline}
                                            onChange={(e) => updateDisciplineType(dIdx, parseInt(e.target.value))}
                                        >
                                            <SelectOptions options={disciplineOptions} />
                                        </Form.Select>
                                    </Stack>
                                    <Button variant="outline-danger" onClick={() => removeDiscipline(dIdx)}>
                                        <BootstrapIcon name="trash" />
                                    </Button>
                                </Stack>

                                <Stack className="ps-3 border-start border-primary border-2">
                                    <Stack direction="horizontal" className="justify-content-between mb-2">
                                        <Stack as="span" className="small fw-bold">
                                            {t('distances')}
                                        </Stack>
                                        <Button
                                            variant="profile-outline-primary"
                                            size="sm"
                                            onClick={() => addDistance(dIdx)}
                                        >
                                            {t('add')}
                                        </Button>
                                    </Stack>
                                    {disc.distances?.map((dist, distIdx) => (
                                        <Stack key={distIdx} gap={2} className="mb-2 p-2 border rounded">
                                            <Stack direction="horizontal" gap={2}>
                                                <InputGroup size="sm">
                                                    <InputGroup.Text>{t('distanceMeters')}</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        value={dist.distance}
                                                        onChange={(e) =>
                                                            updateDistanceValue(
                                                                dIdx,
                                                                distIdx,
                                                                'distance',
                                                                parseInt(e.target.value) || 0,
                                                            )
                                                        }
                                                    />
                                                </InputGroup>
                                                <InputGroup size="sm">
                                                    <InputGroup.Text>{t('timeSeconds')}</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        value={dist.time}
                                                        onChange={(e) =>
                                                            updateDistanceValue(
                                                                dIdx,
                                                                distIdx,
                                                                'time',
                                                                parseInt(e.target.value) || 0,
                                                            )
                                                        }
                                                    />
                                                </InputGroup>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => removeDistance(dIdx, distIdx)}
                                                >
                                                    <BootstrapIcon name="trash" />
                                                </Button>
                                            </Stack>
                                            <Stack className="ps-3 border-start">
                                                <Stack direction="horizontal" className="justify-content-between mb-1">
                                                    <Stack as="small" className="text-muted">
                                                        {t('subDistances')}
                                                    </Stack>
                                                    <Button
                                                        variant="profile-outline-primary"
                                                        className="btn-xs py-0 px-2"
                                                        onClick={() => addSubDistance(dIdx, distIdx)}
                                                    >
                                                        {t('add')}
                                                    </Button>
                                                </Stack>
                                                {dist.subDistances?.map((sub, subIdx) => (
                                                    <Stack key={subIdx} direction="horizontal" gap={2} className="mt-1">
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            placeholder={t('distance')}
                                                            value={sub.subDistance}
                                                            onChange={(e) =>
                                                                updateSubDistanceValue(
                                                                    dIdx,
                                                                    distIdx,
                                                                    subIdx,
                                                                    'subDistance',
                                                                    parseInt(e.target.value) || 0,
                                                                )
                                                            }
                                                        />
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            placeholder={t('time')}
                                                            value={sub.time}
                                                            onChange={(e) =>
                                                                updateSubDistanceValue(
                                                                    dIdx,
                                                                    distIdx,
                                                                    subIdx,
                                                                    'time',
                                                                    parseInt(e.target.value) || 0,
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => removeSubDistance(dIdx, distIdx, subIdx)}
                                                        >
                                                            <BootstrapIcon name="trash" />
                                                        </Button>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Card.Body>
                        </Card>
                    ))}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    {t('cancel')}
                </Button>
                <Button variant="profile-primary" type="submit" form="add-training-form" disabled={loading}>
                    {loading ? t('sending') : t('addTraining')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
