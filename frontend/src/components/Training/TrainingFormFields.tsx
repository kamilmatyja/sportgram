import { type ChangeEvent, type FC } from 'react';
import { Col, Row } from 'react-bootstrap';

import { type TrainingBody } from '../../api/body/TrainingBody';
import { type UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { toUserOptions } from '../../utils/user';
import { DisciplinesEditor, type DisciplinesEditorHandlers } from '../Common/DisciplinesEditor';
import { type FieldErrors, InputField, SelectField } from '../Common/FormFields';

export interface TrainingFormHandlers extends DisciplinesEditorHandlers {
    handleChange: (e: ChangeEvent<any>) => void;
    handleParticipantsChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

interface TrainingFormFieldsProps extends TrainingFormHandlers {
    formData: TrainingBody;
    fieldErrors: FieldErrors;
    availableUsers: UserResponse[];
}

export const TrainingFormFields: FC<TrainingFormFieldsProps> = ({
    formData,
    fieldErrors,
    availableUsers,
    handleChange,
    handleParticipantsChange,
    ...disciplineHandlers
}) => {
    const { t } = useTranslation();

    return (
        <Row className="g-3">
            <Col md={6}>
                <InputField
                    label={t('startedAt')}
                    type="datetime-local"
                    name="startedAt"
                    value={formData.startedAt}
                    onChange={handleChange}
                    error={fieldErrors.startedAt}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('endedAt')}
                    type="datetime-local"
                    name="endedAt"
                    value={formData.endedAt}
                    onChange={handleChange}
                    error={fieldErrors.endedAt}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('title')}
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    error={fieldErrors.title}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('link')}
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    error={fieldErrors.link}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('location')}
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={fieldErrors.location}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('description')}
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    error={fieldErrors.description}
                    required
                />
            </Col>
            <Col xs={12}>
                <SelectField
                    label={t('participants')}
                    name="userIds"
                    value={formData.userIds}
                    onChange={handleParticipantsChange}
                    error={fieldErrors.userIds}
                    options={toUserOptions(availableUsers)}
                    multiple
                />
            </Col>
            <Col xs={12}>
                <DisciplinesEditor
                    disciplines={formData.disciplines}
                    fieldErrors={fieldErrors}
                    withTime
                    {...disciplineHandlers}
                />
            </Col>
        </Row>
    );
};
