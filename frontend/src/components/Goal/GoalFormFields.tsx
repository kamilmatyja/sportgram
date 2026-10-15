import React from 'react';
import { Row, Col } from 'react-bootstrap';

import { GoalBody } from '../../api/body/GoalBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { toUserOptions } from '../../utils/user';
import { type FieldErrors, InputField, SelectField } from '../Common/FormFields';

interface GoalFormFieldsProps {
    formData: GoalBody;
    fieldErrors: FieldErrors;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    availableUsers: UserResponse[];
}

export const GoalFormFields: React.FC<GoalFormFieldsProps> = ({
    formData,
    fieldErrors,
    handleChange,
    handleParticipantsChange,
    availableUsers,
}) => {
    const { t } = useTranslation();

    return (
        <Row className="g-3">
            <Col md={6}>
                <InputField
                    label={t('startedAt')}
                    type="datetime-local"
                    name="startedAt"
                    value={formData.startedAt || ''}
                    onChange={handleChange}
                    error={fieldErrors.startedAt}
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('endedAt')}
                    type="datetime-local"
                    name="endedAt"
                    value={formData.endedAt || ''}
                    onChange={handleChange}
                    error={fieldErrors.endedAt}
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('title')}
                    type="text"
                    name="text"
                    value={formData.text}
                    onChange={handleChange}
                    error={fieldErrors.text}
                    required
                />
            </Col>
            <Col md={4}>
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
            <Col md={4}>
                <SelectField
                    label={t('discipline')}
                    name="discipline"
                    value={formData.discipline || ''}
                    onChange={handleChange}
                    error={fieldErrors.discipline}
                    options={DisciplineEnum.getOptions(t)}
                    placeholder={t('selectOption')}
                    required
                />
            </Col>
            <Col md={4}>
                <InputField
                    label={`${t('distance')} [m]`}
                    type="number"
                    name="distance"
                    value={formData.distance || ''}
                    onChange={handleChange}
                    error={fieldErrors.distance}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={`${t('time')} [s]`}
                    type="number"
                    name="time"
                    value={formData.time || ''}
                    onChange={handleChange}
                    error={fieldErrors.time}
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
        </Row>
    );
};
