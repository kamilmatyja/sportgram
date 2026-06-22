import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FriendBody} from '../../api/body/FriendBody';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {Modal, Form, Button, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

interface AddFriendModalProps {
    user: UserResponse | null;
    show: boolean;
    availableUsers: UserResponse[];
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: FriendBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
                                                                  user,
                                                                  show,
                                                                  availableUsers,
                                                                  closeModal,
                                                                  loading,
                                                                  globalError,
                                                                  fieldErrors,
                                                                  formData,
                                                                  handleChange,
                                                                  handleSubmit
                                                              }) => {
    const {t} = useTranslation();
    if (!show || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);
    const userOptions: SelectOption[] = availableUsers.map(u => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.link})`
    }));

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('addFriend')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form id="add-friend-form" onSubmit={handleSubmit}>
                    {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                    <Form.Group className="mb-3">
                        <Form.Label>{t('user')}</Form.Label>
                        <Form.Select
                            name="receiverUserId"
                            value={formData.receiverUserId}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.receiverUserId}
                            required
                        >
                            <SelectOptions options={userOptions} placeholder={t('selectUser')} />
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {fieldErrors.receiverUserId}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>
                    {t('cancel')}
                </Button>
                <Button variant="profile-primary" type="submit" form="add-friend-form" disabled={loading || availableUsers.length === 0}>
                    {loading ? t('sending') : t('addFriend')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};