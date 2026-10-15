import React from 'react';
import { Form, Button } from 'react-bootstrap';

import { GoalFormFields } from './GoalFormFields';
import { GoalBody } from '../../api/body/GoalBody';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManageGoalModalProps extends FormModalStateProps<GoalBody> {
    user: UserResponse | null;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    goal: GoalResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageGoalModal: React.FC<ManageGoalModalProps> = ({
    user,
    availableUsers,
    handleParticipantsChange,
    show,
    goal,
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
    if (!show || !goal || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId={isMyProfile ? 'edit-goal-form' : undefined}
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
                <Form id="edit-goal-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                    <GoalFormFields
                        formData={formData}
                        fieldErrors={fieldErrors}
                        handleChange={handleChange}
                        handleParticipantsChange={handleParticipantsChange}
                        availableUsers={availableUsers}
                    />
                </Form>
            )}

            <StatusSection
                options={GoalStatusEnum.getOptions(t)}
                current={goal.status}
                canSelect={(status) => isAdmin || (isMyProfile && status !== GoalStatusEnum.REJECTED)}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
