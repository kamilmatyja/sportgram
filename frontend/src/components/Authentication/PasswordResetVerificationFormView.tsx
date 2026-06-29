import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PasswordResetBody} from '../../api/body/PasswordResetBody';
import {Container, Row, Col, Card, Form, Button, Alert, Stack} from 'react-bootstrap';

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
                                                                                                        formData, handleChange, onSubmit, loading, fieldErrors, globalError, onCancel, onResend, resendSuccess
                                                                                                    }) => {
    const {t} = useTranslation();

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4 text-center">
                            <h2 className="mb-4">{t('verify')}</h2>
                            <Form onSubmit={onSubmit}>
                                <Stack gap={3} className="text-start">
                                    {globalError && <Alert variant="danger">{globalError}</Alert>}
                                    {resendSuccess && <Alert variant="success">{t('resendSuccess')}</Alert>}

                                    <Form.Group>
                                        <Form.Label>{t('verificationCode')}</Form.Label>
                                        <Form.Control type="number" name="code" value={formData.code} onChange={handleChange} isInvalid={!!fieldErrors.code} required autoFocus />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>{t('password')}</Form.Label>
                                        <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} isInvalid={!!fieldErrors.password} required />
                                    </Form.Group>

                                    <Button variant="success" type="submit" disabled={loading}>
                                        {t('save')}
                                    </Button>

                                    <Button variant="outline-secondary" onClick={onResend} disabled={loading}>
                                        {t('resend')}
                                    </Button>

                                    <Button variant="link" onClick={onCancel} className="text-muted">
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