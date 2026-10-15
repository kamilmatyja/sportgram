import React from 'react';
import { Form, Button, Row, Col, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { AuthCard } from './AuthCard';
import { SignBody } from '../../api/body/SignBody';
import { useTranslation } from '../../context/TranslationContext';
import { CheckField, type FieldErrors, FormErrorAlert, InputField } from '../Common/FormFields';

interface SignFormViewProps {
    formData: SignBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: FieldErrors;
    globalError: string | null;
}

export const SignFormView: React.FC<SignFormViewProps> = ({
    formData,
    handleChange,
    onSubmit,
    loading,
    fieldErrors,
    globalError,
}) => {
    const { t } = useTranslation();

    return (
        <AuthCard title={t('sign')}>
            <FormErrorAlert error={globalError} />
            <Form onSubmit={onSubmit}>
                <Row className="g-3">
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
                    <Col xs={12}>
                        <CheckField
                            type="checkbox"
                            name="rememberMe"
                            label={t('rememberMe')}
                            checked={formData.rememberMe}
                            onChange={handleChange}
                            error={fieldErrors.rememberMe}
                        />
                    </Col>
                    <Col xs={12}>
                        <Button variant="primary" type="submit" disabled={loading} className="w-100">
                            {loading ? t('sending') : t('save')}
                        </Button>
                    </Col>
                    <Col xs={12}>
                        <Stack direction="horizontal" gap={3} className="justify-content-center small">
                            <Link to="/register" className="text-decoration-none">
                                {t('register')}
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
