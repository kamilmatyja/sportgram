import React from 'react';
import { Card, Stack, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserSubpageHeaderProps {
    user: UserResponse;
}

export const UserSubpageHeader: React.FC<UserSubpageHeaderProps> = ({ user }) => {
    const { t } = useTranslation();

    return (
        <Stack gap={3}>
            <Card className="shadow-sm mb-0 border-0">
                <Stack className="profile-bg-container bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border rounded-top">
                    {user.backgroundPhoto && (
                        <Image
                            src={`data:image/webp;base64,${user.backgroundPhoto}`}
                            className="w-100 h-100 object-fit-cover"
                        />
                    )}
                </Stack>
                <Card.Body className="position-relative pt-5">
                    <Stack>
                        {user.profilePhoto ? (
                            <Image
                                src={`data:image/webp;base64,${user.profilePhoto}`}
                                className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"
                            />
                        ) : (
                            <Stack className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar align-items-center justify-content-center">
                                <BootstrapIcon name="person" className="fs-1 text-muted" />
                            </Stack>
                        )}
                        <Stack className="mt-4 mt-md-3">
                            <Card.Title as="h2" className="mb-0 profile-theme-text fw-bold">
                                {user.firstName} {user.lastName}
                            </Card.Title>
                            <Card.Text className="text-muted mb-0">@{user.link}</Card.Text>
                        </Stack>
                    </Stack>
                </Card.Body>
            </Card>
            <Stack direction="horizontal" className="mb-4">
                <Link to={`/users/${user.link}`} className="btn btn-profile-outline-primary">
                    <BootstrapIcon name="arrow-left" className="me-1" /> {t('profile')}
                </Link>
            </Stack>
        </Stack>
    );
};
