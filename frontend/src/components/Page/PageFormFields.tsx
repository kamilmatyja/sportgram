import React from 'react';
import { Col, Form, Row } from 'react-bootstrap';

import { PageBody } from '../../api/body/PageBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { toUserOptions } from '../../utils/user';
import { type FieldErrors, InputField, SelectField } from '../Common/FormFields';

interface PageFormFieldsProps {
    formData: PageBody;
    fieldErrors: FieldErrors;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    availableUsers: UserResponse[];
    isEdit?: boolean;
}

export const PageFormFields: React.FC<PageFormFieldsProps> = ({
    formData,
    fieldErrors,
    handleChange,
    handleParticipantsChange,
    availableUsers,
    isEdit = false,
}) => {
    const { t } = useTranslation();

    return (
        <Row className="g-3">
            <Col xs={12}>
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
            <Col md={6}>
                <SelectField
                    label={t('color')}
                    name="color"
                    value={formData.color || ''}
                    onChange={handleChange}
                    error={fieldErrors.color}
                    options={ColorEnum.getOptions(t)}
                    placeholder={t('selectOption')}
                    required
                />
            </Col>
            {(['profilePhoto', 'backgroundPhoto'] as const).map((name) => (
                <Col md={6} key={name}>
                    <InputField
                        label={t(name)}
                        type="file"
                        accept="image/*"
                        name={name}
                        onChange={handleChange}
                        error={fieldErrors[name]}
                        required={!isEdit}
                    />
                    {isEdit && <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>}
                </Col>
            ))}
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
