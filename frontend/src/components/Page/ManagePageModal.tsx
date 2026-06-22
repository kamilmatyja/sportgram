import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PageBody} from '../../api/body/PageBody';
import {PageResponse} from '../../api/responses/PageResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {Modal, Form, Button, Row, Col, Stack, Badge, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

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
                                                                    fieldErrors,
                                                                    formData,
                                                                    handleChange,
                                                                    handleEditSubmit,
                                                                    handleStatusSubmit,
                                                                    handleDelete
                                                                }) => {
    const {t} = useTranslation();
    if (!show || !currentPageObj) return null;

    const themeClass = themeColor ? ColorEnum.getClass(themeColor) : '';
    const colorOptions = ColorEnum.getOptions(t) as SelectOption[];
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
                    <Form id="edit-page-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-3">
                        <Form.Group className="mb-3">
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
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('color')}</Form.Label>
                                    <Form.Select
                                        name="color"
                                        value={formData.color || ''}
                                        onChange={handleChange}
                                        isInvalid={!!fieldErrors.color}
                                        required
                                    >
                                        <SelectOptions options={colorOptions} placeholder={t('selectOption')} />
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{fieldErrors.color}</Form.Control.Feedback>
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
                                    />
                                    <Form.Text>{t('photoOptional')}</Form.Text>
                                    <Form.Control.Feedback type="invalid">{fieldErrors.profilePhoto}</Form.Control.Feedback>
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
                                    />
                                    <Form.Text>{t('photoOptional')}</Form.Text>
                                    <Form.Control.Feedback type="invalid">{fieldErrors.backgroundPhoto}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

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
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(currentPageObj.status))?.label || currentPageObj.status}
                            </Badge>
                            {ElementStatusEnum.getOptions(t)
                                .filter(opt => opt.value !== currentPageObj.status)
                                .filter(opt => isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED))
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
                        <Button variant="profile-primary" type="submit" form="edit-page-form" disabled={loading}>
                            {loading ? t('sending') : t('saveChanges')}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};