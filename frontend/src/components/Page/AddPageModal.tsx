import React from 'react';
import { Form } from 'react-bootstrap';

import { PageFormFields } from './PageFormFields';
import { PageBody } from '../../api/body/PageBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddPageModalProps extends FormModalStateProps<PageBody> {
    themeColor?: number;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddPageModal: React.FC<AddPageModalProps> = ({
    themeColor,
    show,
    availableUsers,
    closeModal,
    loading,
    globalError,
    fieldErrors,
    formData,
    handleChange,
    handleParticipantsChange,
    handleSubmit,
}) => {
    const { t } = useTranslation();
    if (!show) return null;

    return (
        <FormModal
            show={show}
            title={t('addPage')}
            themeClass={themeColor ? ColorEnum.getClass(themeColor) : ''}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-page-form"
            submitLabel={t('addPage')}
        >
            <Form id="add-page-form" onSubmit={handleSubmit}>
                <PageFormFields
                    formData={formData}
                    fieldErrors={fieldErrors}
                    handleChange={handleChange}
                    handleParticipantsChange={handleParticipantsChange}
                    availableUsers={availableUsers}
                />
            </Form>
        </FormModal>
    );
};
