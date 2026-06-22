import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FeedBody} from '../../api/body/FeedBody';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {Modal, Form, Button, Stack, Alert, Badge} from 'react-bootstrap';

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
    const {t} = useTranslation();
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
                    <Form id="edit-feed-form" onSubmit={handleEditSubmit} className="mb-4 pb-3 border-bottom">
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
                            <Form.Control.Feedback type="invalid">
                                {fieldErrors.text}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('photo')}</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                name="photo"
                                onChange={handleChange as any}
                                isInvalid={!!fieldErrors.photo}
                            />
                            <Form.Text>{t('photoOptional')}</Form.Text>
                            <Form.Control.Feedback type="invalid">
                                {fieldErrors.photo}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Form>
                )}

                {(isMyProfile || isAdmin) && (
                    <Stack className="mb-2">
                        <Stack direction="horizontal" className="flex-wrap gap-2 align-items-center">
                            <Stack as="strong">{t('status')}: </Stack>
                            <Badge bg="light" text="dark" className="border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(feed.status))?.label || feed.status}
                            </Badge>
                            {ElementStatusEnum.getOptions(t)
                                .filter(opt => opt.value !== feed.status)
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
                        <Button variant="profile-primary" type="submit" form="edit-feed-form" disabled={loading}>
                            {loading ? t('sending') : t('saveChanges')}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};