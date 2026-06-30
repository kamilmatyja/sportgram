import React from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';

import { UserCreateBody } from '../../api/body/UserCreateBody';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import SelectOptions from '../Common/SelectOptions';

interface AddUserModalProps {
    themeColor?: number;
    show: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: UserCreateBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
    themeColor,
    show,
    closeModal,
    loading,
    globalError,
    fieldErrors,
    formData,
    handleChange,
    handleSubmit,
}) => {
    const { t } = useTranslation();
    if (!show) return null;

    const themeClass = themeColor ? ColorEnum.getClass(themeColor) : '';

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addUser')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="add-user-form" onSubmit={handleSubmit}>
                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}
                    <Row className="g-3">
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
                        <Col md={6}>
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
                            </Form.Group>
                        </Col>
                        <Col md={6}>
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
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('phone')}</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    isInvalid={!!fieldErrors.phone}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
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
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('link')}</Form.Label>
                                <Form.Control
                                    name="link"
                                    value={formData.link}
                                    onChange={handleChange}
                                    isInvalid={!!fieldErrors.link}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('gender')}</Form.Label>
                                <Form.Select name="gender" value={formData.gender} onChange={handleChange} required>
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
                                <Form.Select name="country" value={formData.country} onChange={handleChange} required>
                                    <SelectOptions
                                        options={CountryEnum.getOptions(t) as any}
                                        placeholder={t('selectOption')}
                                    />
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('language')}</Form.Label>
                                <Form.Select name="language" value={formData.language} onChange={handleChange} required>
                                    <SelectOptions options={LanguageEnum.getOptions(t) as any} />
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('theme')}</Form.Label>
                                <Form.Select name="theme" value={formData.theme} onChange={handleChange} required>
                                    <SelectOptions options={ThemeEnum.getOptions(t) as any} />
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('color')}</Form.Label>
                                <Form.Select name="color" value={formData.color} onChange={handleChange} required>
                                    <SelectOptions options={ColorEnum.getOptions(t) as any} />
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('role')}</Form.Label>
                                <Form.Select
                                    name="roles"
                                    value={formData.roles.map(String)}
                                    onChange={handleChange}
                                    multiple
                                    required
                                >
                                    <SelectOptions options={RoleEnum.getOptions(t) as any} />
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('discipline')}</Form.Label>
                                <Form.Select
                                    name="disciplines"
                                    value={formData.disciplines.map(String)}
                                    onChange={handleChange}
                                    multiple
                                >
                                    <SelectOptions options={DisciplineEnum.getOptions(t) as any} />
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>{t('bio')}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={3}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('profilePhoto')}</Form.Label>
                                <Form.Control type="file" name="profilePhoto" onChange={handleChange as any} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('backgroundPhoto')}</Form.Label>
                                <Form.Control
                                    type="file"
                                    name="backgroundPhoto"
                                    onChange={handleChange as any}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    {t('cancel')}
                </Button>
                <Button variant="profile-primary" type="submit" form="add-user-form" disabled={loading}>
                    {loading ? t('sending') : t('addUser')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
