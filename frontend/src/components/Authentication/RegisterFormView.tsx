import React from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { RegisterBody } from '../../api/body/RegisterBody';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import SelectOptions from '../Common/SelectOptions';

interface RegisterFormViewProps {
    formData: RegisterBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
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
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={10} lg={7} xl={6}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title as="h2" className="text-center mb-4">
                                {t('register')}
                            </Card.Title>
                            {globalError && <Alert variant="danger">{t(globalError)}</Alert>}
                            <Form onSubmit={onSubmit}>
                                <Stack gap={3}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('firstName')}</Form.Label>
                                                <Form.Control
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    isInvalid={!!fieldErrors.firstName}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('lastName')}</Form.Label>
                                                <Form.Control
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    isInvalid={!!fieldErrors.lastName}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

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

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('phone')}</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    isInvalid={!!fieldErrors.phone}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('birthAt')}</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="birthAt"
                                                    value={formData.birthAt}
                                                    onChange={handleChange}
                                                    isInvalid={!!fieldErrors.birthAt}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('gender')}</Form.Label>
                                                <Form.Select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <SelectOptions
                                                        options={GenderEnum.getOptions(t) as any}
                                                        placeholder={t('selectOption')}
                                                    />
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('country')}</Form.Label>
                                                <Form.Select
                                                    name="country"
                                                    value={formData.country}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <SelectOptions
                                                        options={CountryEnum.getOptions(t) as any}
                                                        placeholder={t('selectOption')}
                                                    />
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group>
                                        <Form.Label>{t('role')}</Form.Label>
                                        <Form.Select
                                            name="roles"
                                            value={formData.roles.map(String)}
                                            onChange={handleChange}
                                            multiple
                                            required
                                        >
                                            <SelectOptions options={RoleEnum.getNanoOptions(t) as any} />
                                        </Form.Select>
                                    </Form.Group>

                                    <Button variant="primary" type="submit" disabled={loading} className="w-100 mt-2">
                                        {loading ? t('sending') : t('save')}
                                    </Button>

                                    <Stack className="text-center">
                                        <Link to="/sign" className="text-decoration-none small">
                                            {t('sign')}
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
