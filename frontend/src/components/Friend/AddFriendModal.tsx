import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

import { FriendBody } from '../../api/body/FriendBody';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { toUserOptions } from '../../utils/user';
import { type FormModalStateProps, SelectField } from '../Common/FormFields';
import { FormModal } from '../Common/FormModal';

interface AddFriendModalProps extends FormModalStateProps<FriendBody> {
    user: UserResponse | null;
    availableUsers: UserResponse[];
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
    handleSubmit,
}) => {
    const { t } = useTranslation();
    if (!show || !user) return null;

    return (
        <FormModal
            show={show}
            title={t('addFriend')}
            themeClass={ColorEnum.getClass(user.color)}
            closeModal={closeModal}
            loading={loading}
            globalError={globalError}
            formId="add-friend-form"
            submitLabel={t('addFriend')}
            submitDisabled={availableUsers.length === 0}
        >
            <Form id="add-friend-form" onSubmit={handleSubmit}>
                <Row className="g-3">
                    <Col xs={12}>
                        <SelectField
                            label={t('user')}
                            name="userId"
                            value={formData.userId}
                            onChange={handleChange}
                            error={fieldErrors.userId}
                            options={toUserOptions(availableUsers)}
                            placeholder={t('selectUser')}
                            required
                        />
                    </Col>
                </Row>
            </Form>
        </FormModal>
    );
};
