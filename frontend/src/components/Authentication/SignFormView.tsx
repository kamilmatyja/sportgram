import React from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { SignBody } from '../../api/body/SignBody';
import { useTranslation } from '../../context/TranslationContext';

interface SignFormViewProps {
    formData: SignBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
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
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={5} xl={4}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title as="h2" className="text-center mb-4">
                                {t('sign')}
                            </Card.Title>
                            <Form onSubmit={onSubmit}>
                                <Stack gap={3}>
                                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                                    <Form.Group>
                                        <Form.Label>{t('email')}</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            isInvalid={!!fieldErrors.email}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {fieldErrors.email}
                                        </Form.Control.Feedback>
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

                                    <Form.Check
                                        type="checkbox"
                                        name="rememberMe"
                                        label={t('rememberMe')}
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />

                                    <Button variant="primary" type="submit" disabled={loading} className="w-100">
                                        {loading ? t('sending') : t('save')}
                                    </Button>

                                    <Stack direction="horizontal" gap={2} className="justify-content-center small mt-2">
                                        <Link to="/register" className="text-decoration-none">
                                            {t('register')}
                                        </Link>
                                        <Stack as="span" className="text-muted"></Stack>
                                        <Link to="/password-reset" className="text-decoration-none">
                                            {t('passwordReset')}
                                        </Link>
                                    </Stack>
                                </Stack>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};
