import React from 'react';
import { Button } from 'react-bootstrap';

import { PushSubscriptionResponse } from '../../api/responses/PushSubscriptionResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

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

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            footerActions={
                isMyProfile && (
                    <Button variant="danger" onClick={handleDelete} disabled={loading}>
                        {t('delete')}
                    </Button>
                )
            }
        >
            <StatusSection
                options={PushSubscriptionStatusEnum.getOptions(t)}
                current={subscription.status}
                canSelect={() => isMyProfile || isAdmin}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
