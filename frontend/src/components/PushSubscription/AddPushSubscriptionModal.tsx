import React from 'react';
import { Button, Stack } from 'react-bootstrap';

import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { FormModal } from '../Common/FormModal';

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
    handleSubscribeDevice,
}) => {
    const { t } = useTranslation();
    if (!show || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('addSubscription')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            footerActions={
                <Button variant="profile-primary" onClick={handleSubscribeDevice} disabled={loading}>
                    {loading ? t('sending') : t('subscribeThisDevice')}
                </Button>
            }
        >
            <Stack gap={3}>
                <Stack as="p" className="mb-0">
                    {t('pushSubscriptionInfo')}
                </Stack>
                <Stack as="p" className="text-muted small mb-0">
                    {t('pushPermissionWillBeAsked')}
                </Stack>
            </Stack>
        </FormModal>
    );
};
