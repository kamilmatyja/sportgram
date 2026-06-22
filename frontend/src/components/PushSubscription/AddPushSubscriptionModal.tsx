import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {Modal, Button, Stack, Alert} from 'react-bootstrap';

interface AddPushSubscriptionModalProps {
    user: UserResponse | null;
    show: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleSubscribeDevice: () => void;
}

export const AddPushSubscriptionModal: React.FC<AddPushSubscriptionModalProps> = ({
                                                                                      user,
                                                                                      show,
                                                                                      closeModal,
                                                                                      loading,
                                                                                      globalError,
                                                                                      handleSubscribeDevice
                                                                                  }) => {
    const {t} = useTranslation();
    if (!show || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addSubscription')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}
                <Stack as="p">{t('pushSubscriptionInfo')}</Stack>
                <Stack as="p" className="text-muted small">{t('pushPermissionWillBeAsked')}</Stack>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>{t('cancel')}</Button>
                <Button variant="profile-primary" onClick={handleSubscribeDevice} disabled={loading}>
                    {loading ? t('sending') : t('subscribeThisDevice')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};