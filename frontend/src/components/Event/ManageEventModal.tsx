import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventBody} from '../../api/body/EventBody';
import {EventResponse} from '../../api/responses/EventResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';
import {Modal, Form, Button, Row, Col, InputGroup, Stack, Badge, Card} from 'react-bootstrap';

interface ManageEventModalProps {
    themeColor?: number;
    show: boolean;
    currentEvent: EventResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: EventBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
    addDiscipline: () => void;
    updateDisciplineType: (index: number, type: number) => void;
    removeDiscipline: (index: number) => void;
    addDistance: (discIndex: number) => void;
    updateDistanceValue: (discIndex: number, distIndex: number, val: number) => void;
    removeDistance: (discIndex: number, distIndex: number) => void;
    addSubDistance: (discIndex: number, distIndex: number) => void;
    updateSubDistanceValue: (discIndex: number, distIndex: number, subIndex: number, val: number) => void;
    removeSubDistance: (discIndex: number, distIndex: number, subIndex: number) => void;
}

export const ManageEventModal: React.FC<ManageEventModalProps> = ({
                                                                      themeColor, show, currentEvent, isMyProfile, isAdmin, closeModal,
                                                                      loading, globalError, fieldErrors, formData, handleChange, handleEditSubmit,
                                                                      handleStatusSubmit, handleDelete, addDiscipline, updateDisciplineType,
                                                                      removeDiscipline, addDistance, updateDistanceValue, removeDistance,
                                                                      addSubDistance, updateSubDistanceValue, removeSubDistance
                                                                  }) => {
    const {t} = useTranslation();
    if (!show || !currentEvent) return null;

    const themeClass = themeColor ? ColorEnum.getClass(themeColor) : '';
    const disciplineOptions = DisciplineEnum.getOptions(t) as SelectOption[];

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Stack className="alert alert-danger">{t(globalError)}</Stack>}

                {isMyProfile && (
                    <Form id="edit-event-form" onSubmit={handleEditSubmit} className="mb-4 pb-3 border-bottom">
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('startedAt')}</Form.Label>
                                    <Form.Control type="datetime-local" name="startedAt" value={formData.startedAt} onChange={handleChange} isInvalid={!!fieldErrors.startedAt} required />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.startedAt}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('endedAt')}</Form.Label>
                                    <Form.Control type="datetime-local" name="endedAt" value={formData.endedAt} onChange={handleChange} isInvalid={!!fieldErrors.endedAt} required />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.endedAt}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('title')}</Form.Label>
                                    <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} isInvalid={!!fieldErrors.title} required />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.title}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('link')}</Form.Label>
                                    <Form.Control type="text" name="link" value={formData.link} onChange={handleChange} isInvalid={!!fieldErrors.link} required />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.link}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('location')}</Form.Label>
                            <Form.Control type="text" name="location" value={formData.location} onChange={handleChange} isInvalid={!!fieldErrors.location} required />
                            <Form.Control.Feedback type="invalid">{fieldErrors.location}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('description')}</Form.Label>
                            <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} isInvalid={!!fieldErrors.description} required rows={3} />
                            <Form.Control.Feedback type="invalid">{fieldErrors.description}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('rules')}</Form.Label>
                            <Form.Control as="textarea" name="rules" value={formData.rules} onChange={handleChange} isInvalid={!!fieldErrors.rules} required rows={3} />
                            <Form.Control.Feedback type="invalid">{fieldErrors.rules}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('photo')}</Form.Label>
                            <Form.Control type="file" accept="image/*" name="photo" onChange={handleChange as any} isInvalid={!!fieldErrors.photo} />
                            <Form.Text>{t('photoOptional')}</Form.Text>
                            <Form.Control.Feedback type="invalid">{fieldErrors.photo}</Form.Control.Feedback>
                        </Form.Group>

                        <Stack direction="horizontal" className="justify-content-between align-items-center mt-4 mb-3">
                            <Card.Title as="h6" className="text-profile-primary mb-0">{t('disciplinesAndDistances')}</Card.Title>
                            <Button variant="profile-outline-primary" size="sm" onClick={addDiscipline}>{t('add')}</Button>
                        </Stack>

                        {formData.disciplines?.map((disc, dIndex) => (
                            <Stack key={dIndex} className="border rounded p-3 mb-3 bg-white">
                                <Stack direction="horizontal" className="justify-content-between align-items-end mb-3">
                                    <Stack className="flex-grow-1 me-3">
                                        <Form.Label>{t('discipline')}</Form.Label>
                                        <Form.Select value={disc.discipline} onChange={e => updateDisciplineType(dIndex, parseInt(e.target.value))}>
                                            <SelectOptions options={disciplineOptions} />
                                        </Form.Select>
                                    </Stack>
                                    <Button variant="outline-danger" onClick={() => removeDiscipline(dIndex)}>
                                        <BootstrapIcon name="trash" />
                                    </Button>
                                </Stack>

                                <Stack className="ps-4 border-start border-2 border-profile-primary">
                                    <Stack direction="horizontal" className="justify-content-between mb-2">
                                        <Stack as="span" className="fw-bold">{t('distances')}</Stack>
                                        <Button variant="profile-outline-primary" size="sm" onClick={() => addDistance(dIndex)}>
                                            {t('add')}
                                        </Button>
                                    </Stack>

                                    {disc.distances?.map((dist, distIndex) => (
                                        <Card key={distIndex} className="mb-2 shadow-none border">
                                            <Card.Body className="p-2">
                                                <Stack direction="horizontal" gap={2} className="align-items-center mb-2">
                                                    <InputGroup size="sm" className="w-50">
                                                        <InputGroup.Text>{t('distanceMeters')}</InputGroup.Text>
                                                        <Form.Control type="number" value={dist.distance} onChange={e => updateDistanceValue(dIndex, distIndex, parseInt(e.target.value) || 0)} />
                                                    </InputGroup>
                                                    <Button variant="outline-danger" size="sm" onClick={() => removeDistance(dIndex, distIndex)}>
                                                        <BootstrapIcon name="trash" />
                                                    </Button>
                                                </Stack>

                                                <Stack className="ps-3 border-start">
                                                    <Stack direction="horizontal" className="justify-content-between mb-2">
                                                        <Stack as="small" className="text-muted">{t('subDistances')}</Stack>
                                                        <Button variant="profile-outline-primary" className="btn-xs py-0 px-2" onClick={() => addSubDistance(dIndex, distIndex)}>
                                                            {t('add')}
                                                        </Button>
                                                    </Stack>
                                                    {dist.subDistances?.map((sub, subIndex) => (
                                                        <Stack key={subIndex} direction="horizontal" gap={2} className="align-items-center mt-1">
                                                            <Form.Control type="number" size="sm" className="w-50" placeholder={t('subDistanceMeters')} value={sub.subDistance} onChange={e => updateSubDistanceValue(dIndex, distIndex, subIndex, parseInt(e.target.value) || 0)} />
                                                            <Button variant="outline-danger" size="sm" onClick={() => removeSubDistance(dIndex, distIndex, subIndex)}>
                                                                <BootstrapIcon name="trash" />
                                                            </Button>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </Stack>
                            </Stack>
                        ))}
                    </Form>
                )}

                {(isMyProfile || isAdmin) && (
                    <Stack className="mb-2">
                        <Stack direction="horizontal" className="flex-wrap gap-2 align-items-center">
                            <Stack as="span" className="fw-bold">{t('status')}:</Stack>
                            <Badge bg="light" text="dark" className="border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(currentEvent.status))?.label || currentEvent.status}
                            </Badge>
                            {ElementStatusEnum.getOptions(t)
                                .filter(opt => opt.value !== currentEvent.status)
                                .filter(opt => isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED))
                                .map(opt => (
                                    <Button key={opt.value} variant="profile-outline-primary" className="btn-xs py-0 px-2" disabled={loading} onClick={() => handleStatusSubmit(opt.value)}>
                                        {loading ? t('loading') : opt.label}
                                    </Button>
                                ))}
                        </Stack>
                    </Stack>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>{t('cancel')}</Button>
                {isMyProfile && (
                    <>
                        <Button variant="danger" onClick={handleDelete} disabled={loading}>{loading ? t('sending') : t('delete')}</Button>
                        <Button variant="profile-primary" type="submit" form="edit-event-form" disabled={loading}>{loading ? t('sending') : t('saveChanges')}</Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};