import React from 'react';
import { Modal, Button, Stack, Badge, Alert } from 'react-bootstrap';

import { NotificationResponse } from '../../api/responses/NotificationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';

interface ManageNotificationModalProps {
    user: UserResponse | null;
    show: boolean;
    notification: NotificationResponse | null;
    isMyProfile: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageNotificationModal: React.FC<ManageNotificationModalProps> = ({
    user,
    show,
    notification,
    isMyProfile,
    closeModal,
    loading,
    globalError,
    handleStatusSubmit,
    handleDelete,
}) => {
    const { t } = useTranslation();
    if (!show || !notification || !user || !isMyProfile) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {NotificationStatusEnum.getOptions(t).find(
                            (opt) => String(opt.value) === String(notification.status),
                        )?.label || notification.status}
                    </Badge>
                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {NotificationStatusEnum.getOptions(t)
                            .filter((opt) => opt.value !== notification.status)
                            .map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant="profile-outline-primary"
                                    size="sm"
                                    className="btn-xs py-0 px-2"
                                    disabled={loading}
                                    onClick={() => handleStatusSubmit(opt.value)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                    </Stack>
                </Stack>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>
                    {t('cancel')}
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={loading}>
                    {loading ? t('sending') : t('delete')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
