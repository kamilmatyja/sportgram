import React from 'react';
import { Form, Button, Row, Col, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { AuthCard } from './AuthCard';
import { EmailBody } from '../../api/body/EmailBody';
import { useTranslation } from '../../context/TranslationContext';
import { type FieldErrors, FormErrorAlert, InputField } from '../Common/FormFields';

interface PasswordResetFormViewProps {
    formData: EmailBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: FieldErrors;
    globalError: string;
}

export const PasswordResetFormView: React.FC<PasswordResetFormViewProps> = ({
    formData,
    handleChange,
    onSubmit,
    loading,
    fieldErrors,
    globalError,
}) => {
    const { t } = useTranslation();

    return (
        <AuthCard title={t('passwordReset')}>
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
                        <Button variant="primary" type="submit" disabled={loading} className="w-100">
                            {loading ? t('sending') : t('save')}
                        </Button>
                    </Col>
                    <Col xs={12}>
                        <Stack direction="horizontal" gap={3} className="justify-content-center small">
                            <Link to="/sign" className="text-decoration-none">
                                {t('sign')}
                            </Link>
                            <Link to="/register" className="text-decoration-none">
                                {t('register')}
                            </Link>
                        </Stack>
                    </Col>
                </Row>
            </Form>
        </AuthCard>
    );
};
