import React from 'react';
import { Button } from 'react-bootstrap';

import { NotificationResponse } from '../../api/responses/NotificationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

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

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            footerActions={
                <Button variant="danger" onClick={handleDelete} disabled={loading}>
                    {t('delete')}
                </Button>
            }
        >
            <StatusSection
                options={NotificationStatusEnum.getOptions(t)}
                current={notification.status}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
