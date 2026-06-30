import React from 'react';
import { Modal, Form, Button, Stack, Alert, Badge } from 'react-bootstrap';

import { StoryBody } from '../../api/body/StoryBody';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

interface ManageStoryModalProps {
    user: UserResponse | null;
    show: boolean;
    story: StoryResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: StoryBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageStoryModal: React.FC<ManageStoryModalProps> = ({
    user,
    show,
    story,
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
    handleDelete,
}) => {
    const { t } = useTranslation();
    if (!show || !story || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                {isMyProfile && (
                    <Form id="edit-story-form" onSubmit={handleEditSubmit} className="mb-4 pb-4 border-bottom">
                        <Form.Group className="mb-3">
                            <Form.Label>{t('text')}</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="text"
                                value={formData.text || ''}
                                onChange={handleChange}
                                isInvalid={!!fieldErrors.text}
                                required
                                rows={3}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>{t('photo')}</Form.Label>
                            <Form.Control type="file" accept="image/*" name="photo" onChange={handleChange as any} />
                            <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>
                        </Form.Group>
                    </Form>
                )}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {ElementStatusEnum.getOptions(t).find((opt) => opt.value === story.status)?.label ||
                            story.status}
                    </Badge>
                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {ElementStatusEnum.getOptions(t)
                            .filter(
                                (opt) =>
                                    opt.value !== story.status &&
                                    (isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED)),
                            )
                            .map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant="profile-outline-primary"
                                    size="sm"
                                    className="py-0 px-2 btn-xs"
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
                        <Button variant="profile-primary" type="submit" form="edit-story-form" disabled={loading}>
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                )}
            </Modal.Footer>
        </Modal>
    );
};
