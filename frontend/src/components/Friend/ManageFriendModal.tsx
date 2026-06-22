import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {Modal, Button, Badge, Stack, Alert} from 'react-bootstrap';

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
                                                                        handleDelete
                                                                    }) => {
    const {t} = useTranslation();
    if (!show || !friend || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('manage')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {globalError && <Alert variant="danger">{t(globalError)}</Alert>}

                <Stack direction="horizontal" className="flex-wrap gap-2 align-items-center">
                    <Stack as="strong">{t('status')}: </Stack>
                    <Badge bg="light" text="dark" className="border profile-theme-border">
                        {FriendStatusEnum.getOptions(t).find(opt => String(opt.value) === String(friend.status))?.label || friend.status}
                    </Badge>
                    {FriendStatusEnum.getOptions(t)
                        .filter(opt => opt.value !== friend.status)
                        .filter(opt => opt.value !== FriendStatusEnum.PENDING)
                        .map(opt => (
                            <Button
                                key={opt.value}
                                variant="profile-outline-primary"
                                size="sm"
                                className="py-0 px-2 btn-xs"
                                disabled={loading}
                                onClick={() => handleStatusSubmit(opt.value)}
                            >
                                {loading ? t('loading') : opt.label}
                            </Button>
                        ))}
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