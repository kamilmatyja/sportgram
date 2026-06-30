import React from 'react';
import { Modal, Form, Button, Row, Col, InputGroup, Stack, Badge, Card, Alert } from 'react-bootstrap';

import { TrainingBody } from '../../api/body/TrainingBody';
import { TrainingDistance } from '../../api/body/TrainingDistance';
import { TrainingSubDistance } from '../../api/body/TrainingSubDistance';
import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

interface ManageTrainingModalProps {
    user: UserResponse | null;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    show: boolean;
    currentTraining: TrainingResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: TrainingBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
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

export const ManageTrainingModal: React.FC<ManageTrainingModalProps> = ({
    user,
    availableUsers,
    handleParticipantsChange,
    show,
    currentTraining,
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
    if (!show || !currentTraining || !user) return null;

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
                    <Form id="edit-training-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('startedAt')}</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="startedAt"
                                        value={formData.startedAt}
                                        onChange={handleChange}
                                        required
                                    />
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
                                        required
                                    />
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
                                        required
                                    />
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
                                        required
                                    />
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
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('description')}</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={3}
                            />
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
                            <Stack as="h6" className="text-profile-primary mb-0 fw-bold">
                                {t('disciplinesAndDistances')}
                            </Stack>
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
                                                        <InputGroup.Text>m</InputGroup.Text>
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
                                                        <InputGroup.Text>s</InputGroup.Text>
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
                                                    <Stack
                                                        direction="horizontal"
                                                        className="justify-content-between mb-1"
                                                    >
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
                                                    {dist.subDistances?.map((sub, sIdx) => (
                                                        <Stack
                                                            key={sIdx}
                                                            direction="horizontal"
                                                            gap={1}
                                                            className="mt-1"
                                                        >
                                                            <Form.Control
                                                                type="number"
                                                                size="sm"
                                                                value={sub.subDistance}
                                                                onChange={(e) =>
                                                                    updateSubDistanceValue(
                                                                        dIdx,
                                                                        distIdx,
                                                                        sIdx,
                                                                        'subDistance',
                                                                        parseInt(e.target.value) || 0,
                                                                    )
                                                                }
                                                            />
                                                            <Form.Control
                                                                type="number"
                                                                size="sm"
                                                                value={sub.time}
                                                                onChange={(e) =>
                                                                    updateSubDistanceValue(
                                                                        dIdx,
                                                                        distIdx,
                                                                        sIdx,
                                                                        'time',
                                                                        parseInt(e.target.value) || 0,
                                                                    )
                                                                }
                                                            />
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => removeSubDistance(dIdx, distIdx, sIdx)}
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
                )}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {ElementStatusEnum.getOptions(t).find((opt) => opt.value === currentTraining.status)?.label ||
                            currentTraining.status}
                    </Badge>
                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {(isAdmin || isMyProfile) &&
                            ElementStatusEnum.getOptions(t)
                                .filter(
                                    (opt) =>
                                        opt.value !== currentTraining.status &&
                                        (isAdmin || opt.value !== ElementStatusEnum.REJECTED),
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
                        <Button variant="profile-primary" type="submit" form="edit-training-form" disabled={loading}>
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                )}
            </Modal.Footer>
        </Modal>
    );
};
