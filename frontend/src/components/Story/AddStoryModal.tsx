import React from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

import { StoryBody } from '../../api/body/StoryBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';

interface AddStoryModalProps {
    user: UserResponse | null;
    show: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: StoryBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
    user,
    show,
    closeModal,
    loading,
    globalError,
    fieldErrors,
    formData,
    handleChange,
    handleSubmit,
}) => {
    const { t } = useTranslation();
    if (!show || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addStory')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="add-story-form" onSubmit={handleSubmit}>
                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                    <Form.Group className="mb-3">
                        <Form.Label>{t('text')}</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="text"
                            value={formData.text}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.text}
                            required
                            rows={4}
                        />
                        <Form.Control.Feedback type="invalid">{fieldErrors.text}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('photo')}</Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            name="photo"
                            onChange={handleChange as any}
                            isInvalid={!!fieldErrors.photo}
                            required
                        />
                        <Form.Control.Feedback type="invalid">{fieldErrors.photo}</Form.Control.Feedback>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    {t('cancel')}
                </Button>
                <Button variant="profile-primary" type="submit" form="add-story-form" disabled={loading}>
                    {loading ? t('sending') : t('addStory')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
