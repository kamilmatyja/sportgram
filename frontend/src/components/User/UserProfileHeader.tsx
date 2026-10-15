import React from 'react';
import { Card, Stack, Button, Dropdown, Spinner } from 'react-bootstrap';

import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { getOptionLabel } from '../../utils/options';
import { formatUserName } from '../../utils/user';
import { Base64Image } from '../Common/Base64Image';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserProfileHeaderProps {
    user: UserResponse;
    friendship: FriendResponse | null;
    isMyProfile: boolean;
    handleAddFriend: () => void;
    handleUpdateFriendStatus: (status: number) => void;
    actionLoading: boolean;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
    user,
    friendship,
    isMyProfile,
    handleAddFriend,
    handleUpdateFriendStatus,
    actionLoading,
}) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm mb-4 border-0">
            <Stack className="profile-bg-container bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border rounded-top">
                <Base64Image
                    data={user.backgroundPhoto}
                    alt={t('backgroundPhoto')}
                    className="w-100 h-100 object-fit-cover"
                />
            </Stack>
            <Card.Body className="position-relative pt-5">
                <Stack>
                    <Base64Image
                        data={user.profilePhoto}
                        alt={t('profilePhoto')}
                        className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"
                        fallback={
                            <Stack className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar align-items-center justify-content-center">
                                <BootstrapIcon name="person" className="fs-1 text-muted" />
                            </Stack>
                        }
                    />
                    <Stack
                        direction="horizontal"
                        className="mt-4 mt-md-3 justify-content-between align-items-start gap-3"
                    >
                        <Stack>
                            <Card.Title as="h2" className="mb-0 profile-theme-text fw-bold">
                                {formatUserName(user)}
                            </Card.Title>
                            <Card.Text className="text-muted mb-0">@{user.link}</Card.Text>
                        </Stack>
                        {!isMyProfile && !friendship && (
                            <Button
                                variant="profile-outline-primary"
                                onClick={handleAddFriend}
                                disabled={actionLoading}
                                className="flex-shrink-0"
                            >
                                {actionLoading ? (
                                    <Spinner animation="border" size="sm" />
                                ) : (
                                    <BootstrapIcon name="person-plus" className="me-1" />
                                )}
                                {t('addFriend')}
                            </Button>
                        )}
                        {!isMyProfile && friendship && (
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    variant="profile-outline-primary"
                                    size="sm"
                                    disabled={actionLoading}
                                    className="flex-shrink-0"
                                >
                                    {t('status')}: {getOptionLabel(FriendStatusEnum.getOptions(t), friendship.status)}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {FriendStatusEnum.getNanoOptions(t)
                                        .filter((o) => o.value !== friendship.status)
                                        .map((opt) => (
                                            <Dropdown.Item
                                                key={opt.value}
                                                onClick={() => handleUpdateFriendStatus(opt.value)}
                                            >
                                                {opt.label}
                                            </Dropdown.Item>
                                        ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        )}
                    </Stack>
                </Stack>
            </Card.Body>
        </Card>
    );
};
