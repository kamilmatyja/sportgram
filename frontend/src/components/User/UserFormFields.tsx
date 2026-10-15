import React from 'react';
import { Col, Form, Row } from 'react-bootstrap';

import { UserCreateBody } from '../../api/body/UserCreateBody';
import { UserUpdateBody } from '../../api/body/UserUpdateBody';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import { type FieldErrors, InputField, SelectField } from '../Common/FormFields';
import { type SelectOption } from '../Common/SelectOptions';

interface UserFormFieldsProps {
    formData: UserCreateBody | UserUpdateBody;
    fieldErrors: FieldErrors;
    handleChange: (e: React.ChangeEvent<any>) => void;
    roleOptions: SelectOption[];
    isEdit?: boolean;
}

export const UserFormFields: React.FC<UserFormFieldsProps> = ({
    formData,
    fieldErrors,
    handleChange,
    roleOptions,
    isEdit = false,
}) => {
    const { t } = useTranslation();

    return (
        <Row className="g-3">
            <Col md={6}>
                <InputField
                    label={t('firstName')}
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={fieldErrors.firstName}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('lastName')}
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={fieldErrors.lastName}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('email')}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={fieldErrors.email}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('password')}
                    type="password"
                    name="password"
                    value={formData.password ?? ''}
                    onChange={handleChange}
                    error={fieldErrors.password}
                    required={!isEdit}
                />
                {isEdit && <Form.Text className="text-muted small">{t('passwordOptional')}</Form.Text>}
            </Col>
            <Col md={4}>
                <InputField
                    label={t('phone')}
                    type="number"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    error={fieldErrors.phone}
                    required
                />
            </Col>
            <Col md={4}>
                <InputField
                    label={t('birthAt')}
                    type="date"
                    name="birthAt"
                    value={formData.birthAt}
                    onChange={handleChange}
                    error={fieldErrors.birthAt}
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
            <Col md={6}>
                <SelectField
                    label={t('gender')}
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    error={fieldErrors.gender}
                    options={GenderEnum.getOptions(t)}
                    placeholder={t('selectOption')}
                    required
                />
            </Col>
            <Col md={6}>
                <SelectField
                    label={t('country')}
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    error={fieldErrors.country}
                    options={CountryEnum.getOptions(t)}
                    placeholder={t('selectOption')}
                    required
                />
            </Col>
            <Col md={4}>
                <SelectField
                    label={t('language')}
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    error={fieldErrors.language}
                    options={LanguageEnum.getOptions(t)}
                    placeholder={t('selectOption')}
                    required
                />
            </Col>
            <Col md={4}>
                <SelectField
                    label={t('theme')}
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    error={fieldErrors.theme}
                    options={ThemeEnum.getOptions(t)}
                    placeholder={t('selectOption')}
                    required
                />
            </Col>
            <Col md={4}>
                <SelectField
                    label={t('color')}
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    error={fieldErrors.color}
                    options={ColorEnum.getOptions(t)}
                    placeholder={t('selectOption')}
                    required
                />
            </Col>
            <Col md={6}>
                <SelectField
                    label={t('role')}
                    name="roles"
                    value={formData.roles.map(String)}
                    onChange={handleChange}
                    error={fieldErrors.roles}
                    options={roleOptions}
                    multiple
                    required
                />
            </Col>
            <Col md={6}>
                <SelectField
                    label={t('discipline')}
                    name="disciplines"
                    value={formData.disciplines.map(String)}
                    onChange={handleChange}
                    error={fieldErrors.disciplines}
                    options={DisciplineEnum.getOptions(t)}
                    multiple
                />
            </Col>
            <Col xs={12}>
                <InputField
                    label={t('bio')}
                    as="textarea"
                    rows={3}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    error={fieldErrors.bio}
                    required
                />
            </Col>
            <Col md={6}>
                <InputField
                    label={t('profilePhoto')}
                    type="file"
                    name="profilePhoto"
                    onChange={handleChange}
                    error={fieldErrors.profilePhoto}
                    required={!isEdit}
                />
                {isEdit && <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>}
            </Col>
            <Col md={6}>
                <InputField
                    label={t('backgroundPhoto')}
                    type="file"
                    name="backgroundPhoto"
                    onChange={handleChange}
                    error={fieldErrors.backgroundPhoto}
                    required={!isEdit}
                />
                {isEdit && <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>}
            </Col>
        </Row>
    );
};
