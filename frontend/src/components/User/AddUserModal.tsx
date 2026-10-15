import React from 'react';
import { Form } from 'react-bootstrap';

import { UserFormFields } from './UserFormFields';
import { UserCreateBody } from '../../api/body/UserCreateBody';
import { useTranslation } from '../../context/TranslationContext';
import { RoleEnum } from '../../enums/RoleEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddUserModalProps extends FormModalStateProps<UserCreateBody> {
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
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
    if (!show) return null;

    return (
        <FormModal
            show={show}
            title={t('addUser')}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-user-form"
            submitLabel={t('addUser')}
        >
            <Form id="add-user-form" onSubmit={handleSubmit}>
                <UserFormFields
                    formData={formData}
                    fieldErrors={fieldErrors}
                    handleChange={handleChange}
                    roleOptions={RoleEnum.getOptions(t)}
                />
            </Form>
        </FormModal>
    );
};
