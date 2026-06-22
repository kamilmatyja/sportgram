import React, {useState, useRef, useEffect} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {Card, Stack, Image, Button, Dropdown, Spinner} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserProfileHeaderProps {
    user: UserResponse;
    currentUser: UserResponse | null;
    friendship: FriendResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleAddFriend: () => void;
    handleUpdateFriendStatus: (status: number) => void;
    actionLoading: boolean;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
                                                                        user,
                                                                        currentUser,
                                                                        friendship,
                                                                        isMyProfile,
                                                                        handleAddFriend,
                                                                        handleUpdateFriendStatus,
                                                                        actionLoading
                                                                    }) => {
    const {t} = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <Card className="shadow-sm mb-4">
            <Stack className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                {user.backgroundPhoto && (
                    <Image src={`data:image/webp;base64,${user.backgroundPhoto}`} alt="Background"
                           className="w-100 h-100 object-fit-cover"/>
                )}
            </Stack>
            <Card.Body
                className="position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                <Stack>
                    {user.profilePhoto ? (
                        <Image src={`data:image/webp;base64,${user.profilePhoto}`} alt="Profile"
                               className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"/>
                    ) : (
                        <Stack
                            className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar align-items-center justify-content-center">
                            <BootstrapIcon name="person" className="fs-1 text-muted" />
                        </Stack>
                    )}
                    <Stack className="mt-4 mt-md-3">
                        <Card.Title as="h2" className="mb-0 profile-theme-text fw-bold">{user.firstName} {user.lastName}</Card.Title>
                        <Card.Text as="p" className="text-muted mb-0">@{user.link}</Card.Text>
                    </Stack>
                </Stack>

                <Stack direction="horizontal" className="flex-wrap gap-2 align-items-center">
                    {!isMyProfile && !friendship && (
                        <Button variant="profile-outline-primary" onClick={handleAddFriend} disabled={actionLoading}>
                            {actionLoading ? <Spinner animation="border" size="sm" className="me-2" /> : <BootstrapIcon name="person-plus" className="me-1" />}
                            {t('addFriend')}
                        </Button>
                    )}

                    {!isMyProfile && friendship && (
                        <Dropdown show={dropdownOpen} onToggle={setDropdownOpen} ref={dropdownRef as any}>
                            <Dropdown.Toggle variant="profile-outline-primary" disabled={actionLoading}>
                                {actionLoading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                                {t('status')}: {FriendStatusEnum.getOptions(t).find(opt => opt.value === friendship.status)?.label}
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                                {(friendship.senderUserId === currentUser?.id || friendship.receiverUserId === currentUser?.id) && (
                                    FriendStatusEnum.getNanoOptions(t).map(opt => (
                                        opt.value !== friendship.status && (
                                            <Dropdown.Item key={opt.value} onClick={() => {
                                                setDropdownOpen(false);
                                                handleUpdateFriendStatus(opt.value);
                                            }}>
                                                {opt.label}
                                            </Dropdown.Item>
                                        )
                                    ))
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    )}
                </Stack>
            </Card.Body>
        </Card>
    );
};