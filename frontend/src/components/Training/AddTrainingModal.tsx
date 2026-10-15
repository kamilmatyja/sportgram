import React from 'react';
import { Form } from 'react-bootstrap';

import { type TrainingFormHandlers, TrainingFormFields } from './TrainingFormFields';
import { type TrainingBody } from '../../api/body/TrainingBody';
import { type UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddTrainingModalProps extends FormModalStateProps<TrainingBody>, TrainingFormHandlers {
    user: UserResponse | null;
    availableUsers: UserResponse[];
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddTrainingModal: React.FC<AddTrainingModalProps> = ({
    user,
    show,
    closeModal,
    loading,
    globalError,
    handleSubmit,
    ...formProps
}) => {
    const { t } = useTranslation();
    if (!show || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('addTraining')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-training-form"
            submitLabel={t('addTraining')}
        >
            <Form id="add-training-form" onSubmit={handleSubmit}>
                <TrainingFormFields {...formProps} />
            </Form>
        </FormModal>
    );
};
