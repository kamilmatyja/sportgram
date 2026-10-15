import React from 'react';
import { Form } from 'react-bootstrap';

import { StoryFormFields } from './StoryFormFields';
import { StoryBody } from '../../api/body/StoryBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddStoryModalProps extends FormModalStateProps<StoryBody> {
    user: UserResponse | null;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
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
            title={t('addStory')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-story-form"
            submitLabel={t('addStory')}
        >
            <Form id="add-story-form" onSubmit={handleSubmit}>
                <StoryFormFields formData={formData} fieldErrors={fieldErrors} handleChange={handleChange} />
            </Form>
        </FormModal>
    );
};
