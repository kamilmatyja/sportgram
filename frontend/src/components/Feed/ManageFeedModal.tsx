import React from 'react';
import { Button, Form } from 'react-bootstrap';

import { FeedFormFields } from './FeedFormFields';
import { FeedBody } from '../../api/body/FeedBody';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManageFeedModalProps extends FormModalStateProps<FeedBody> {
    user: UserResponse | null;
    feed: FeedResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageFeedModal: React.FC<ManageFeedModalProps> = ({
    user,
    show,
    feed,
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
    if (!show || !feed || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId={isMyProfile ? 'edit-feed-form' : undefined}
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
                <Form id="edit-feed-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                    <FeedFormFields formData={formData} fieldErrors={fieldErrors} handleChange={handleChange} isEdit />
                </Form>
            )}

            <StatusSection
                options={ElementStatusEnum.getOptions(t)}
                current={feed.status}
                canSelect={(status) => isAdmin || (isMyProfile && status !== ElementStatusEnum.REJECTED)}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
