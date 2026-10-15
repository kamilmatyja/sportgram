import React from 'react';
import { Button, Form } from 'react-bootstrap';

import { StoryFormFields } from './StoryFormFields';
import { StoryBody } from '../../api/body/StoryBody';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManageStoryModalProps extends FormModalStateProps<StoryBody> {
    user: UserResponse | null;
    story: StoryResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageStoryModal: React.FC<ManageStoryModalProps> = ({
    user,
    show,
    story,
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
    if (!show || !story || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId={isMyProfile ? 'edit-story-form' : undefined}
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
                <Form id="edit-story-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                    <StoryFormFields formData={formData} fieldErrors={fieldErrors} handleChange={handleChange} isEdit />
                </Form>
            )}

            <StatusSection
                options={ElementStatusEnum.getOptions(t)}
                current={story.status}
                canSelect={(status) => isAdmin || (isMyProfile && status !== ElementStatusEnum.REJECTED)}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
