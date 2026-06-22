import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {GenderEnum} from '../../enums/GenderEnum';
import {CountryEnum} from '../../enums/CountryEnum';
import {RoleEnum} from '../../enums/RoleEnum';
import {RegisterBody} from '../../api/body/RegisterBody';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';
import {Container, Row, Col, Card, Form, Button, Alert, Stack} from 'react-bootstrap';

interface RegisterFormViewProps {
    formData: RegisterBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
    globalError: string;
}

export const RegisterFormView: React.FC<RegisterFormViewProps> = ({
                                                                      formData, handleChange, onSubmit, loading, fieldErrors, globalError
                                                                  }) => {
    const {t} = useTranslation();

    const genderOptions = GenderEnum.getOptions(t) as SelectOption[];
    const countryOptions = CountryEnum.getOptions(t) as SelectOption[];
    const roleOptions = RoleEnum.getNanoOptions(t) as SelectOption[];

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={5}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <Card.Title as="h2" className="text-center mb-4">{t('register')}</Card.Title>
                            {globalError && <Alert variant="danger">{globalError}</Alert>}
                            <Form onSubmit={onSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('firstName')}</Form.Label>
                                            <Form.Control name="firstName" value={formData.firstName || ''} onChange={handleChange} isInvalid={!!fieldErrors.firstName} required />
                                            <Form.Control.Feedback type="invalid">{fieldErrors.firstName}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('lastName')}</Form.Label>
                                            <Form.Control name="lastName" value={formData.lastName || ''} onChange={handleChange} isInvalid={!!fieldErrors.lastName} required />
                                            <Form.Control.Feedback type="invalid">{fieldErrors.lastName}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('email')}</Form.Label>
                                    <Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} isInvalid={!!fieldErrors.email} required />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('password')}</Form.Label>
                                    <Form.Control type="password" name="password" minLength={8} value={formData.password || ''} onChange={handleChange} isInvalid={!!fieldErrors.password} required />
                                    <Form.Control.Feedback type="invalid">{fieldErrors.password}</Form.Control.Feedback>
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('phone')}</Form.Label>
                                            <Form.Control type="number" name="phone" value={formData.phone || ''} onChange={handleChange} isInvalid={!!fieldErrors.phone} required />
                                            <Form.Control.Feedback type="invalid">{fieldErrors.phone}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('birthAt')}</Form.Label>
                                            <Form.Control type="date" name="birthAt" value={formData.birthAt || ''} onChange={handleChange} isInvalid={!!fieldErrors.birthAt} required />
                                            <Form.Control.Feedback type="invalid">{fieldErrors.birthAt}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('gender')}</Form.Label>
                                    <Form.Select name="gender" value={formData.gender || ''} onChange={handleChange} isInvalid={!!fieldErrors.gender} required>
                                        <SelectOptions options={genderOptions} placeholder={t('gender')} />
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{fieldErrors.gender}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('country')}</Form.Label>
                                    <Form.Select name="country" value={formData.country || ''} onChange={handleChange} isInvalid={!!fieldErrors.country} required>
                                        <SelectOptions options={countryOptions} placeholder={t('country')} />
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{fieldErrors.country}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('role')}</Form.Label>
                                    <Form.Select
                                        name="roles"
                                        value={Array.isArray(formData.roles) ? formData.roles.map(String) : []}
                                        onChange={handleChange}
                                        isInvalid={!!fieldErrors.roles}
                                        multiple
                                        required
                                    >
                                        <SelectOptions options={roleOptions} />
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{fieldErrors.roles}</Form.Control.Feedback>
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                                    {loading ? t('sending') : t('save')}
                                </Button>
                            </Form>

                            <Stack className="mt-3 text-center" direction="vertical">
                                <Link to="/sign" className="btn btn-link">{t('sign')}</Link>
                            </Stack>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};