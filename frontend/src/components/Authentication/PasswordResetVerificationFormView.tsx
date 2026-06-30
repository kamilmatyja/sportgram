import React from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Stack } from 'react-bootstrap';

import { PasswordResetBody } from '../../api/body/PasswordResetBody';
import { useTranslation } from '../../context/TranslationContext';

interface PasswordResetVerificationFormViewProps {
    formData: PasswordResetBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
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
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={5} xl={4}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4 text-center">
                            <Card.Title as="h2" className="mb-4">
                                {t('verify')}
                            </Card.Title>
                            <Form onSubmit={onSubmit}>
                                <Stack gap={3} className="text-start">
                                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}
                                    {resendSuccess && <Alert variant="success">{t('resendSuccess')}</Alert>}

                                    <Form.Group>
                                        <Form.Label>{t('verificationCode')}</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleChange}
                                            isInvalid={!!fieldErrors.code}
                                            required
                                            autoFocus
                                        />
                                        <Form.Control.Feedback type="invalid">{fieldErrors.code}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>{t('password')}</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            isInvalid={!!fieldErrors.password}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors.password}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Button variant="success" type="submit" disabled={loading} className="w-100">
                                        {t('save')}
                                    </Button>

                                    <Button
                                        variant="outline-secondary"
                                        onClick={onResend}
                                        disabled={loading}
                                        className="w-100"
                                    >
                                        {t('resend')}
                                    </Button>

                                    <Button variant="link" onClick={onCancel} className="text-muted w-100">
                                        {t('cancel')}
                                    </Button>
                                </Stack>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};
