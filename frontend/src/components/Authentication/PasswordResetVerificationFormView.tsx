import React from 'react';
import { Form, Button, Row, Col, Stack, Alert } from 'react-bootstrap';

import { AuthCard } from './AuthCard';
import { PasswordResetBody } from '../../api/body/PasswordResetBody';
import { useTranslation } from '../../context/TranslationContext';
import { type FieldErrors, FormErrorAlert, InputField } from '../Common/FormFields';

interface PasswordResetVerificationFormViewProps {
    formData: PasswordResetBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: FieldErrors;
    globalError: string;
    onCancel: () => void;
    onResend: (e: React.MouseEvent<HTMLButtonElement>) => void;
    resendSuccess: boolean;
}

export const PasswordResetVerificationFormView: React.FC<PasswordResetVerificationFormViewProps> = ({
    formData,
    handleChange,
    onSubmit,
    loading,
    fieldErrors,
    globalError,
    onCancel,
    onResend,
    resendSuccess,
}) => {
    const { t } = useTranslation();

    return (
        <AuthCard title={t('verify')}>
            <FormErrorAlert error={globalError} />
            {resendSuccess && <Alert variant="success">{t('resendSuccess')}</Alert>}
            <Form onSubmit={onSubmit}>
                <Row className="g-3">
                    <Col xs={12}>
                        <InputField
                            label={t('verificationCode')}
                            type="number"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            error={fieldErrors.code}
                            required
                            autoFocus
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
                        <Button variant="primary" type="submit" disabled={loading} className="w-100">
                            {loading ? t('sending') : t('save')}
                        </Button>
                    </Col>
                    <Col xs={12}>
                        <Stack direction="horizontal" gap={3} className="justify-content-center small">
                            <Button
                                variant="link"
                                onClick={onResend}
                                disabled={loading}
                                className="p-0 small text-decoration-none"
                            >
                                {t('resend')}
                            </Button>
                            <Button variant="link" onClick={onCancel} className="p-0 small text-decoration-none">
                                {t('cancel')}
                            </Button>
                        </Stack>
                    </Col>
                </Row>
            </Form>
        </AuthCard>
    );
};
