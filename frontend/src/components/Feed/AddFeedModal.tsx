import React from 'react';
import { Form } from 'react-bootstrap';

import { FeedFormFields } from './FeedFormFields';
import { FeedBody } from '../../api/body/FeedBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddFeedModalProps extends FormModalStateProps<FeedBody> {
    user: UserResponse | null;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddFeedModal: React.FC<AddFeedModalProps> = ({
    user,
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
    if (!show || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('addFeed')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-feed-form"
            submitLabel={t('addFeed')}
        >
            <Form id="add-feed-form" onSubmit={handleSubmit}>
                <FeedFormFields formData={formData} fieldErrors={fieldErrors} handleChange={handleChange} />
            </Form>
        </FormModal>
    );
};
