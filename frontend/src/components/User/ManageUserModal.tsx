import React from 'react';
import { Button, Form } from 'react-bootstrap';

import { UserFormFields } from './UserFormFields';
import { UserUpdateBody } from '../../api/body/UserUpdateBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManageUserModalProps extends FormModalStateProps<UserUpdateBody> {
    themeColor?: number;
    managedUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageUserModal: React.FC<ManageUserModalProps> = ({
    themeColor,
    show,
    managedUser,
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
    const { t } = useTranslation();
    if (!show || !managedUser) return null;

    const roleOptions = isAdmin ? RoleEnum.getOptions(t) : RoleEnum.getNanoOptions(t);

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={ColorEnum.getClass(themeColor)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId={isMyProfile ? 'edit-user-form' : undefined}
            submitLabel={t('saveChanges')}
            footerActions={
                isMyProfile && (
                    <Button variant="danger" onClick={handleDelete} disabled={loading}>
                        {t('delete')}
                    </Button>
                )
            }
        >
            {isMyProfile && (
                <Form id="edit-user-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                    <UserFormFields
                        formData={formData}
                        fieldErrors={fieldErrors}
                        handleChange={handleChange}
                        roleOptions={roleOptions}
                        isEdit
                    />
                </Form>
            )}

            <StatusSection
                options={UserStatusEnum.getOptions(t)}
                current={managedUser.status}
                canSelect={(status) => isAdmin && status !== UserStatusEnum.PENDING}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
