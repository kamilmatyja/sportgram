import React from 'react';
import { Form } from 'react-bootstrap';

import { GoalFormFields } from './GoalFormFields';
import { GoalBody } from '../../api/body/GoalBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddGoalModalProps extends FormModalStateProps<GoalBody> {
    user: UserResponse | null;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
    user,
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
    if (!show || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('addGoal')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-goal-form"
            submitLabel={t('addGoal')}
        >
            <Form id="add-goal-form" onSubmit={handleSubmit}>
                <GoalFormFields
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
