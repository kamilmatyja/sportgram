import React from 'react';
import { Button, Form } from 'react-bootstrap';

import { type TrainingFormHandlers, TrainingFormFields } from './TrainingFormFields';
import { type TrainingBody } from '../../api/body/TrainingBody';
import { type TrainingResponse } from '../../api/responses/TrainingResponse';
import { type UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManageTrainingModalProps extends FormModalStateProps<TrainingBody>, TrainingFormHandlers {
    user: UserResponse | null;
    availableUsers: UserResponse[];
    currentTraining: TrainingResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageTrainingModal: React.FC<ManageTrainingModalProps> = ({
    user,
    show,
    currentTraining,
    isMyProfile,
    isAdmin,
    closeModal,
    loading,
    globalError,
    handleEditSubmit,
    handleStatusSubmit,
    handleDelete,
    ...formProps
}) => {
    const { t } = useTranslation();
    if (!show || !currentTraining || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId={isMyProfile ? 'edit-training-form' : undefined}
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
                <Form id="edit-training-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                    <TrainingFormFields {...formProps} />
                </Form>
            )}
            <StatusSection
                options={ElementStatusEnum.getOptions(t)}
                current={currentTraining.status}
                canSelect={(status) => isAdmin || (isMyProfile && status !== ElementStatusEnum.REJECTED)}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
