import React from 'react';
import { Col, Form, Row } from 'react-bootstrap';

import { StoryBody } from '../../api/body/StoryBody';
import { useTranslation } from '../../context/TranslationContext';
import { type FieldErrors, InputField } from '../Common/FormFields';

interface StoryFormFieldsProps {
    formData: StoryBody;
    fieldErrors: FieldErrors;
    handleChange: (e: React.ChangeEvent<any>) => void;
    isEdit?: boolean;
}

export const StoryFormFields: React.FC<StoryFormFieldsProps> = ({
    formData,
    fieldErrors,
    handleChange,
    isEdit = false,
}) => {
    const { t } = useTranslation();

    return (
        <Row className="g-3">
            <Col xs={12}>
                <InputField
                    label={t('text')}
                    as="textarea"
                    rows={4}
                    name="text"
                    value={formData.text || ''}
                    onChange={handleChange}
                    error={fieldErrors.text}
                    required
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('photo')}
                    type="file"
                    accept="image/*"
                    name="photo"
                    onChange={handleChange}
                    error={fieldErrors.photo}
                    required={!isEdit}
                />
                {isEdit && <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>}
            </Col>
        </Row>
    );
};
