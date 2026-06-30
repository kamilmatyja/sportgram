import React from 'react';
import { Modal, Form, Button, Stack, Alert, Badge } from 'react-bootstrap';

import { FeedBody } from '../../api/body/FeedBody';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

interface ManageFeedModalProps {
    user: UserResponse | null;
    show: boolean;
    feed: FeedResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: FeedBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageFeedModal: React.FC<ManageFeedModalProps> = ({
    user,
    show,
    feed,
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
    if (!show || !feed || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                {isMyProfile && (
                    <Form id="edit-feed-form" onSubmit={handleEditSubmit} className="mb-4 pb-4 border-bottom">
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
                            <Form.Control type="file" onChange={handleChange as any} />
                            <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>
                        </Form.Group>
                    </Form>
                )}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {ElementStatusEnum.getOptions(t).find((opt) => opt.value === feed.status)?.label || feed.status}
                    </Badge>
                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {ElementStatusEnum.getOptions(t)
                            .filter(
                                (opt) =>
                                    opt.value !== feed.status &&
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
                    <>
                        <Button variant="danger" onClick={handleDelete} disabled={loading}>
                            {t('delete')}
                        </Button>
                        <Button variant="profile-primary" type="submit" form="edit-feed-form" disabled={loading}>
                            {t('saveChanges')}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};
