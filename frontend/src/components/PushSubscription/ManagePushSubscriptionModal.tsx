import React from 'react';
import { Modal, Button, Stack, Badge, Alert } from 'react-bootstrap';

import { PushSubscriptionResponse } from '../../api/responses/PushSubscriptionResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';

interface ManagePushSubscriptionModalProps {
    user: UserResponse | null;
    show: boolean;
    subscription: PushSubscriptionResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManagePushSubscriptionModal: React.FC<ManagePushSubscriptionModalProps> = ({
    user,
    show,
    subscription,
    isMyProfile,
    isAdmin,
    closeModal,
    loading,
    globalError,
    handleStatusSubmit,
    handleDelete,
}) => {
    const { t } = useTranslation();
    if (!show || !subscription || !user) return null;

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
                        {PushSubscriptionStatusEnum.getOptions(t).find((opt) => opt.value === subscription.status)
                            ?.label || subscription.status}
                    </Badge>

                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {(isMyProfile || isAdmin) &&
                            PushSubscriptionStatusEnum.getOptions(t)
                                .filter((opt) => opt.value !== subscription.status)
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
                <Button variant="secondary" onClick={closeModal}>
                    {t('cancel')}
                </Button>
                {isMyProfile && (
                    <Button variant="danger" onClick={handleDelete} disabled={loading}>
                        {loading ? t('sending') : t('delete')}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};
