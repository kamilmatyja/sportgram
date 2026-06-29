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
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <h2 className="text-center mb-4">{t('passwordReset')}</h2>
                            <Form onSubmit={onSubmit}>
                                <Stack gap={3}>
                                    {globalError && <Alert variant="danger">{globalError}</Alert>}

                                    <Form.Group>
                                        <Form.Label>{t('email')}</Form.Label>
                                        <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} isInvalid={!!fieldErrors.email} required />
                                    </Form.Group>

                                    <Button variant="primary" type="submit" disabled={loading}>
                                        {loading ? t('sending') : t('save')}
                                    </Button>

                                    <Stack direction="horizontal" gap={2} className="justify-content-center small">
                                        <Link to="/sign">{t('sign')}</Link>
                                        <span className="text-muted">|</span>
                                        <Link to="/register">{t('register')}</Link>
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