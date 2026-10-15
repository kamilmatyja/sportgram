import React from 'react';
import { Col, Form } from 'react-bootstrap';

import { type EventFormHandlers, EventFormFields } from './EventFormFields';
import { type EventBody } from '../../api/body/EventBody';
import { type PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { type FormModalStateProps, SelectField } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddEventModalProps extends FormModalStateProps<EventBody>, EventFormHandlers {
    themeColor?: number;
    myPages: PageResponse[];
    selectedPageId: string;
    setSelectedPageId: (id: string) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
    themeColor,
    show,
    myPages,
    selectedPageId,
    setSelectedPageId,
    closeModal,
    loading,
    globalError,
    handleSubmit,
    ...formProps
}) => {
    const { t } = useTranslation();
    if (!show) return null;

    return (
        <FormModal
            show={show}
            title={t('addEvent')}
            themeClass={themeColor ? ColorEnum.getClass(themeColor) : ''}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-event-form"
            submitLabel={t('addEvent')}
        >
            <Form id="add-event-form" onSubmit={handleSubmit}>
                <EventFormFields {...formProps}>
                    <Col xs={12}>
                        <SelectField
                            label={t('page')}
                            value={selectedPageId}
                            onChange={(e) => setSelectedPageId(e.target.value)}
                            options={myPages.map((page) => ({ value: page.id, label: page.title }))}
                            placeholder={t('selectPage')}
                            required
                        />
                    </Col>
                </EventFormFields>
            </Form>
        </FormModal>
    );
};
