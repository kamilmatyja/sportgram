import React from 'react';
import { Button, Form } from 'react-bootstrap';

import { type EventFormHandlers, EventFormFields } from './EventFormFields';
import { type EventBody } from '../../api/body/EventBody';
import { type EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { type FormModalStateProps } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';
import { StatusSection } from '../Common/StatusButtons';

interface ManageEventModalProps extends FormModalStateProps<EventBody>, EventFormHandlers {
    themeColor?: number;
    currentEvent: EventResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageEventModal: React.FC<ManageEventModalProps> = ({
    themeColor,
    show,
    currentEvent,
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
    if (!show || !currentEvent) return null;

    return (
        <FormModal
            show={show}
            title={t('manage')}
            themeClass={themeColor ? ColorEnum.getClass(themeColor) : ''}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId={isMyProfile ? 'edit-event-form' : undefined}
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
                <Form id="edit-event-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                    <EventFormFields {...formProps} isEdit />
                </Form>
            )}
            <StatusSection
                options={ElementStatusEnum.getOptions(t)}
                current={currentEvent.status}
                canSelect={(status) => isAdmin || (isMyProfile && status !== ElementStatusEnum.REJECTED)}
                onSelect={handleStatusSubmit}
                disabled={loading}
            />
        </FormModal>
    );
};
