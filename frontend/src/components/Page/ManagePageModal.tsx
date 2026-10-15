import React from 'react';
import { Button, Form } from 'react-bootstrap';

import { PageFormFields } from './PageFormFields';
import { PageBody } from '../../api/body/PageBody';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManagePageModalProps extends FormModalStateProps<PageBody> {
    themeColor?: number;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    currentPageObj: PageResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManagePageModal: React.FC<ManagePageModalProps> = ({
    themeColor,
    availableUsers,
    handleParticipantsChange,
    show,
    currentPageObj,
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
    if (!show || !currentPageObj) return null;

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={themeColor ? ColorEnum.getClass(themeColor) : ''}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId={isMyProfile ? 'edit-page-form' : undefined}
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
                <Form id="edit-page-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                    <PageFormFields
                        formData={formData}
                        fieldErrors={fieldErrors}
                        handleChange={handleChange}
                        handleParticipantsChange={handleParticipantsChange}
                        availableUsers={availableUsers}
                        isEdit
                    />
                </Form>
            )}

            <StatusSection
                options={ElementStatusEnum.getOptions(t)}
                current={currentPageObj.status}
                canSelect={(status) => isAdmin || (isMyProfile && status !== ElementStatusEnum.REJECTED)}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
