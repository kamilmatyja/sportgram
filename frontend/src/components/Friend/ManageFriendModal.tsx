import React from 'react';
import { Modal, Button, Badge, Stack, Alert } from 'react-bootstrap';

import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';

interface ManageFriendModalProps {
    user: UserResponse | null;
    show: boolean;
    friend: FriendResponse | null;
    isMyProfile: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageFriendModal: React.FC<ManageFriendModalProps> = ({
    user,
    show,
    friend,
    isMyProfile,
    closeModal,
    loading,
    globalError,
    handleStatusSubmit,
    handleDelete,
}) => {
    const { t } = useTranslation();
    if (!show || !friend || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
                    <Stack as="strong" className="small">
                        {t('status')}:
                    </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {FriendStatusEnum.getOptions(t).find((opt) => opt.value === friend.status)?.label ||
                            friend.status}
                    </Badge>
                    <Stack direction="horizontal" gap={1} className="ms-auto flex-wrap">
                        {FriendStatusEnum.getOptions(t)
                            .filter((opt) => opt.value !== friend.status && opt.value !== FriendStatusEnum.PENDING)
                            .map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant="profile-outline-primary"
                                    size="sm"
                                    className="btn-xs py-0 px-2"
                                    disabled={loading}
                                    onClick={() => handleStatusSubmit(opt.value)}
                                >
                                    {loading ? t('loading') : opt.label}
                                </Button>
                            ))}
                    </Stack>
                </Stack>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>
                    {t('cancel')}
                </Button>
                {isMyProfile && (
                    <Button variant="danger" onClick={handleDelete} disabled={loading}>
                        {loading ? t('sending') : t('delete')}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};
