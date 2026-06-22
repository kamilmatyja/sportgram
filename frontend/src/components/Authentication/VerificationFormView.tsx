import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {CodeBody} from '../../api/body/CodeBody';
import {Container, Row, Col, Card, Form, Button, Alert, Stack} from 'react-bootstrap';

interface VerificationFormViewProps {
    formData: CodeBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
    globalError: string;
    onCancel: () => void;
    onResend: (e: React.MouseEvent<HTMLButtonElement>) => void;
    resendSuccess: boolean;
}

export const VerificationFormView: React.FC<VerificationFormViewProps> = ({
                                                                              formData, handleChange, onSubmit, loading, fieldErrors, globalError, onCancel, onResend, resendSuccess
                                                                          }) => {
    const {t} = useTranslation();

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={5}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title as="h2" className="text-center mb-4">{t('verify')}</Card.Title>
                            <Form onSubmit={onSubmit}>
                                {globalError && <Alert variant="danger">{globalError}</Alert>}
                                {resendSuccess && <Alert variant="success">{t('resendSuccess')}</Alert>}

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('verificationCode')}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="code"
                                        value={formData.code || ''}
                                        onChange={handleChange}
                                        min={100000}
                                        max={999999}
                                        isInvalid={!!fieldErrors.code}
                                        required
                                        autoFocus
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {Array.isArray(fieldErrors.code) ? fieldErrors.code[0] : fieldErrors.code}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Stack gap={2}>
                                    <Button variant="success" type="submit" className="py-2" disabled={loading}>
                                        {loading ? t('sending') : t('save')}
                                    </Button>
                                    <Button variant="outline-secondary" type="button" className="py-2" onClick={onResend} disabled={loading}>
                                        {t('resend')}
                                    </Button>
                                    <Button variant="link" type="button" className="text-muted mt-2" onClick={onCancel}>
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