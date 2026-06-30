import React from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';

import { PageBody } from '../../api/body/PageBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

interface AddPageModalProps {
    themeColor?: number;
    show: boolean;
    availableUsers: UserResponse[];
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: PageBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddPageModal: React.FC<AddPageModalProps> = ({
    themeColor,
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
}) => {
    const { t } = useTranslation();
    if (!show) return null;

    const themeClass = themeColor ? ColorEnum.getClass(themeColor) : '';
    const colorOptions = ColorEnum.getOptions(t) as SelectOption[];
    const userOptions: SelectOption[] = availableUsers.map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.link})`,
    }));

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addPage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="add-page-form" onSubmit={handleSubmit}>
                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                    <Form.Group className="mb-3">
                        <Form.Label>{t('title')}</Form.Label>
                        <Form.Control
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.title}
                            required
                        />
                        <Form.Control.Feedback type="invalid">{fieldErrors.title}</Form.Control.Feedback>
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

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('link')}</Form.Label>
                                <Form.Control
                                    name="link"
                                    value={formData.link}
                                    onChange={handleChange}
                                    isInvalid={!!fieldErrors.link}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">{fieldErrors.link}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('color')}</Form.Label>
                                <Form.Select name="color" value={formData.color || ''} onChange={handleChange} required>
                                    <SelectOptions options={colorOptions} placeholder={t('selectOption')} />
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('profilePhoto')}</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    name="profilePhoto"
                                    onChange={handleChange as any}
                                    isInvalid={!!fieldErrors.profilePhoto}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('backgroundPhoto')}</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    name="backgroundPhoto"
                                    onChange={handleChange as any}
                                    isInvalid={!!fieldErrors.backgroundPhoto}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

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
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    {t('cancel')}
                </Button>
                <Button variant="profile-primary" type="submit" form="add-page-form" disabled={loading}>
                    {loading ? t('sending') : t('addPage')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
