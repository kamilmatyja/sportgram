import React from 'react';
import { Button } from 'react-bootstrap';

import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManageFriendModalProps {
    user: UserResponse | null;
    show: boolean;
    friend: FriendResponse | null;
    isMyProfile: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageFriendModal: React.FC<ManageFriendModalProps> = ({
    user,
    show,
    friend,
    isMyProfile,
    closeModal,
    loading,
    globalError,
    handleStatusSubmit,
    handleDelete,
}) => {
    const { t } = useTranslation();
    if (!show || !friend || !user) return null;

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
                options={FriendStatusEnum.getOptions(t)}
                current={friend.status}
                canSelect={(status) => status !== FriendStatusEnum.PENDING}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
