import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {PushSubscriptionStatusEnum} from '../../enums/PushSubscriptionStatusEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {Modal, Button, Stack, Badge, Alert} from 'react-bootstrap';

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
                                                                                            handleDelete
                                                                                        }) => {
    const {t} = useTranslation();
    if (!show || !subscription || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                {(isMyProfile || isAdmin) && (
                    <Stack direction="horizontal" className="flex-wrap gap-2 align-items-center">
                        <Stack as="strong">{t('status')}: </Stack>
                        <Badge bg="light" text="dark" className="border profile-theme-border">
                            {PushSubscriptionStatusEnum.getOptions(t).find(opt => String(opt.value) === String(subscription.status))?.label || subscription.status}
                        </Badge>
                        {PushSubscriptionStatusEnum.getOptions(t)
                            .filter(opt => opt.value !== subscription.status)
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
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>{t('cancel')}</Button>
                {isMyProfile && (
                    <Button variant="danger" onClick={handleDelete} disabled={loading}>
                        {loading ? t('sending') : t('delete')}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};