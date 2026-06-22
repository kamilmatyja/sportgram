import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GenderEnum} from '../../enums/GenderEnum';
import {CountryEnum} from '../../enums/CountryEnum';
import {RoleEnum} from '../../enums/RoleEnum';
import {LanguageEnum} from '../../enums/LanguageEnum';
import {ThemeEnum} from '../../enums/ThemeEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {UserCreateBody} from '../../api/body/UserCreateBody';
import {Modal, Form, Button, Row, Col, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

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
                                                              handleSubmit
                                                          }) => {
    const {t} = useTranslation();

    if (!show) return null;

    const themeClass = themeColor ? ColorEnum.getClass(themeColor) : '';

    const genderOptions = GenderEnum.getOptions(t) as SelectOption[];
    const countryOptions = CountryEnum.getOptions(t) as SelectOption[];
    const languageOptions = LanguageEnum.getOptions(t) as SelectOption[];
    const themeOptions = ThemeEnum.getOptions(t) as SelectOption[];
    const colorOptions = ColorEnum.getOptions(t) as SelectOption[];
    const roleOptions = RoleEnum.getOptions(t) as SelectOption[];
    const disciplineOptions = DisciplineEnum.getOptions(t) as SelectOption[];

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addUser')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="add-user-form" onSubmit={handleSubmit}>
                    {globalError && <Alert variant="danger">{globalError}</Alert>}

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('firstName')}</Form.Label>
                                <Form.Control name="firstName" value={formData.firstName || ''} onChange={handleChange} isInvalid={!!fieldErrors.firstName} required />
                                <Form.Control.Feedback type="invalid">{fieldErrors.firstName}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('lastName')}</Form.Label>
                                <Form.Control name="lastName" value={formData.lastName || ''} onChange={handleChange} isInvalid={!!fieldErrors.lastName} required />
                                <Form.Control.Feedback type="invalid">{fieldErrors.lastName}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('email')}</Form.Label>
                                <Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} isInvalid={!!fieldErrors.email} required />
                                <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('password')}</Form.Label>
                                <Form.Control type="password" name="password" minLength={8} value={formData.password || ''} onChange={handleChange} isInvalid={!!fieldErrors.password} required />
                                <Form.Control.Feedback type="invalid">{fieldErrors.password}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('phone')}</Form.Label>
                                <Form.Control type="number" name="phone" value={formData.phone || ''} onChange={handleChange} isInvalid={!!fieldErrors.phone} required />
                                <Form.Control.Feedback type="invalid">{fieldErrors.phone}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('birthAt')}</Form.Label>
                                <Form.Control type="date" name="birthAt" value={formData.birthAt || ''} onChange={handleChange} isInvalid={!!fieldErrors.birthAt} required />
                                <Form.Control.Feedback type="invalid">{fieldErrors.birthAt}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>{t('link')}</Form.Label>
                                <Form.Control type="text" name="link" value={formData.link || ''} onChange={handleChange} isInvalid={!!fieldErrors.link} required />
                                <Form.Control.Feedback type="invalid">{fieldErrors.link}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('gender')}</Form.Label>
                                <Form.Select name="gender" value={formData.gender || ''} onChange={handleChange} isInvalid={!!fieldErrors.gender} required>
                                    <SelectOptions options={genderOptions} placeholder={t('gender')} />
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{fieldErrors.gender}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('country')}</Form.Label>
                                <Form.Select name="country" value={formData.country || ''} onChange={handleChange} isInvalid={!!fieldErrors.country} required>
                                    <SelectOptions options={countryOptions} placeholder={t('country')} />
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{fieldErrors.country}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('language')}</Form.Label>
                                <Form.Select name="language" value={formData.language || ''} onChange={handleChange} isInvalid={!!fieldErrors.language} required>
                                    <SelectOptions options={languageOptions} placeholder={t('language')} />
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{fieldErrors.language}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('theme')}</Form.Label>
                                <Form.Select name="theme" value={formData.theme || ''} onChange={handleChange} isInvalid={!!fieldErrors.theme} required>
                                    <SelectOptions options={themeOptions} placeholder={t('theme')} />
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{fieldErrors.theme}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('color')}</Form.Label>
                                <Form.Select name="color" value={formData.color || ''} onChange={handleChange} isInvalid={!!fieldErrors.color} required>
                                    <SelectOptions options={colorOptions} placeholder={t('color')} />
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{fieldErrors.color}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('role')}</Form.Label>
                                <Form.Select name="roles" multiple value={Array.isArray(formData.roles) ? formData.roles.map(String) : []} onChange={handleChange} isInvalid={!!fieldErrors.roles} required>
                                    <SelectOptions options={roleOptions} />
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{fieldErrors.roles}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('discipline')}</Form.Label>
                        <Form.Select name="disciplines" multiple value={Array.isArray(formData.disciplines) ? formData.disciplines.map(String) : []} onChange={handleChange} isInvalid={!!fieldErrors.disciplines}>
                            <SelectOptions options={disciplineOptions} />
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{fieldErrors.disciplines}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('bio')}</Form.Label>
                        <Form.Control as="textarea" name="bio" rows={4} value={formData.bio || ''} onChange={handleChange} isInvalid={!!fieldErrors.bio} required />
                        <Form.Control.Feedback type="invalid">{fieldErrors.bio}</Form.Control.Feedback>
                    </Form.Group>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('profilePhoto')}</Form.Label>
                                <Form.Control type="file" accept="image/*" name="profilePhoto" onChange={handleChange as any} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('backgroundPhoto')}</Form.Label>
                                <Form.Control type="file" accept="image/*" name="backgroundPhoto" onChange={handleChange as any} required />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>{t('cancel')}</Button>
                <Button variant="profile-primary" type="submit" form="add-user-form" disabled={loading}>
                    {loading ? t('sending') : t('addUser')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};