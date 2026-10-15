import React from 'react';
import { Form, Button, Row, Col, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { AuthCard } from './AuthCard';
import { RegisterBody } from '../../api/body/RegisterBody';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { type FieldErrors, FormErrorAlert, InputField, SelectField } from '../Common/FormFields';

interface RegisterFormViewProps {
    formData: RegisterBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: FieldErrors;
    globalError: string;
}

export const RegisterFormView: React.FC<RegisterFormViewProps> = ({
    formData,
    handleChange,
    onSubmit,
    loading,
    fieldErrors,
    globalError,
}) => {
    const { t } = useTranslation();

    return (
        <AuthCard title={t('register')} wide>
            <FormErrorAlert error={globalError} />
            <Form onSubmit={onSubmit}>
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
                    <Col xs={12}>
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
                    <Col xs={12}>
                        <InputField
                            label={t('password')}
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={fieldErrors.password}
                            required
                        />
                    </Col>
                    <Col md={6}>
                        <InputField
                            label={t('phone')}
                            type="number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={fieldErrors.phone}
                            required
                        />
                    </Col>
                    <Col md={6}>
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
                    <Col xs={12}>
                        <SelectField
                            label={t('role')}
                            name="roles"
                            value={formData.roles.map(String)}
                            onChange={handleChange}
                            error={fieldErrors.roles}
                            options={RoleEnum.getNanoOptions(t)}
                            multiple
                            required
                        />
                    </Col>
                    <Col xs={12}>
                        <Button variant="primary" type="submit" disabled={loading} className="w-100">
                            {loading ? t('sending') : t('save')}
                        </Button>
                    </Col>
                    <Col xs={12}>
                        <Stack direction="horizontal" gap={3} className="justify-content-center small">
                            <Link to="/sign" className="text-decoration-none">
                                {t('sign')}
                            </Link>
                            <Link to="/password-reset" className="text-decoration-none">
                                {t('passwordReset')}
                            </Link>
                        </Stack>
                    </Col>
                </Row>
            </Form>
        </AuthCard>
    );
};
