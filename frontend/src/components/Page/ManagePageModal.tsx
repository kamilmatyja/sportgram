import React from 'react';
import { Modal, Form, Button, Row, Col, Stack, Badge, Alert } from 'react-bootstrap';

import { PageBody } from '../../api/body/PageBody';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

interface ManagePageModalProps {
    themeColor?: number;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    show: boolean;
    currentPageObj: PageResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: PageBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManagePageModal: React.FC<ManagePageModalProps> = ({
    themeColor,
    availableUsers,
    handleParticipantsChange,
    show,
    currentPageObj,
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
    if (!show || !currentPageObj) return null;

    const themeClass = themeColor ? ColorEnum.getClass(themeColor) : '';
    const colorOptions = ColorEnum.getOptions(t) as SelectOption[];
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
                    <Form id="edit-page-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                        <Form.Group className="mb-3">
                            <Form.Label>{t('title')}</Form.Label>
                            <Form.Control name="title" value={formData.title} onChange={handleChange} required />
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

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('link')}</Form.Label>
                                    <Form.Control name="link" value={formData.link} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('color')}</Form.Label>
                                    <Form.Select name="color" value={formData.color} onChange={handleChange} required>
                                        <SelectOptions options={colorOptions} />
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('profilePhoto')}</Form.Label>
                                    <Form.Control type="file" onChange={handleChange as any} />
                                    <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('backgroundPhoto')}</Form.Label>
                                    <Form.Control type="file" onChange={handleChange as any} />
                                    <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>
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
                )}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {ElementStatusEnum.getOptions(t).find((opt) => opt.value === currentPageObj.status)?.label ||
                            currentPageObj.status}
                    </Badge>
                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {ElementStatusEnum.getOptions(t)
                            .filter(
                                (opt) =>
                                    opt.value !== currentPageObj.status &&
                                    (isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED)),
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
                        <Button variant="profile-primary" type="submit" form="edit-page-form" disabled={loading}>
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                )}
            </Modal.Footer>
        </Modal>
    );
};
