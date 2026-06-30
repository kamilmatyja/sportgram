import React from 'react';
import { Modal, Form, Button, Row, Col, Stack, Badge, Alert } from 'react-bootstrap';

import { UserUpdateBody } from '../../api/body/UserUpdateBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

interface ManageUserModalProps {
    themeColor?: number;
    show: boolean;
    managedUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: UserUpdateBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageUserModal: React.FC<ManageUserModalProps> = ({
    themeColor,
    show,
    managedUser,
    isMyProfile,
    isAdmin,
    closeModal,
    loading,
    globalError,
    formData,
    handleChange,
    handleEditSubmit,
    handleStatusSubmit,
    handleDelete,
}) => {
    const { t } = useTranslation();
    if (!show || !managedUser) return null;

    const themeClass = ColorEnum.getClass(themeColor);
    const roleOptions = (isAdmin ? RoleEnum.getOptions(t) : RoleEnum.getNanoOptions(t)) as SelectOption[];

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                {isMyProfile && (
                    <Form id="edit-user-form" onSubmit={handleEditSubmit} className="mb-4 pb-4 border-bottom">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('firstName')}</Form.Label>
                                    <Form.Control
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
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
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('password')}</Form.Label>
                                    <Form.Control type="password" name="password" onChange={handleChange} />
                                    <Form.Text className="text-muted small">{t('passwordOptional')}</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('phone')}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
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
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('link')}</Form.Label>
                                    <Form.Control name="link" value={formData.link} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('gender')}</Form.Label>
                                    <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                                        <SelectOptions options={GenderEnum.getOptions(t) as any} />
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('country')}</Form.Label>
                                    <Form.Select name="country" value={formData.country} onChange={handleChange}>
                                        <SelectOptions options={CountryEnum.getOptions(t) as any} />
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('language')}</Form.Label>
                                    <Form.Select name="language" value={formData.language} onChange={handleChange}>
                                        <SelectOptions options={LanguageEnum.getOptions(t) as any} />
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('theme')}</Form.Label>
                                    <Form.Select name="theme" value={formData.theme} onChange={handleChange}>
                                        <SelectOptions options={ThemeEnum.getOptions(t) as any} />
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>{t('color')}</Form.Label>
                                    <Form.Select name="color" value={formData.color} onChange={handleChange}>
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
                                    >
                                        <SelectOptions options={roleOptions} />
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
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('profilePhoto')}</Form.Label>
                                    <Form.Control type="file" name="profilePhoto" onChange={handleChange as any} />
                                    <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('backgroundPhoto')}</Form.Label>
                                    <Form.Control type="file" name="backgroundPhoto" onChange={handleChange as any} />
                                    <Form.Text className="text-muted small">{t('photoOptional')}</Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                )}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {UserStatusEnum.getOptions(t).find((opt) => opt.value === managedUser.status)?.label ||
                            managedUser.status}
                    </Badge>
                    {isAdmin && (
                        <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                            {UserStatusEnum.getNanoOptions(t)
                                .filter((opt) => opt.value !== managedUser.status)
                                .map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant="profile-outline-primary"
                                        className="btn-xs py-0 px-2"
                                        onClick={() => handleStatusSubmit(opt.value)}
                                        disabled={loading}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                        </Stack>
                    )}
                </Stack>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    {t('cancel')}
                </Button>
                {isMyProfile && (
                    <Stack direction="horizontal" gap={2}>
                        <Button variant="danger" onClick={handleDelete} disabled={loading}>
                            {t('delete')}
                        </Button>
                        <Button variant="profile-primary" type="submit" form="edit-user-form" disabled={loading}>
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                )}
            </Modal.Footer>
        </Modal>
    );
};
