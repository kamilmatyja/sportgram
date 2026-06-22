import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {EmailBody} from '../../api/body/EmailBody';
import {Container, Row, Col, Card, Form, Button, Alert, Stack} from 'react-bootstrap';

interface PasswordResetFormViewProps {
    formData: EmailBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
    globalError: string;
}

export const PasswordResetFormView: React.FC<PasswordResetFormViewProps> = ({
                                                                                formData, handleChange, onSubmit, loading, fieldErrors, globalError
                                                                            }) => {
    const {t} = useTranslation();

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={5}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title as="h2" className="text-center mb-4">{t('passwordReset')}</Card.Title>
                            <Form onSubmit={onSubmit}>
                                {globalError && <Alert variant="danger">{globalError}</Alert>}

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('email')}</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        isInvalid={!!fieldErrors.email}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {fieldErrors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                                    {loading ? t('sending') : t('save')}
                                </Button>
                            </Form>

                            <Stack direction="horizontal" gap={2} className="mt-3 justify-content-center align-items-center">
                                <Link to="/sign" className="btn btn-link">{t('sign')}</Link>
                                <Card.Text className="mb-0 text-muted">|</Card.Text>
                                <Link to="/register" className="btn btn-link">{t('register')}</Link>
                            </Stack>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};