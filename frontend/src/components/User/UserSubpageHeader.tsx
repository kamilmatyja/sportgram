import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {Link} from 'react-router-dom';
import {Card, Stack, Image} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserSubpageHeaderProps {
    user: UserResponse;
}

export const UserSubpageHeader: React.FC<UserSubpageHeaderProps> = ({user}) => {
    const {t} = useTranslation();

    return (
        <>
            <Card className="shadow-sm mb-4">
                <Stack className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    {user.backgroundPhoto && (
                        <Image src={`data:image/webp;base64,${user.backgroundPhoto}`} alt="Background"
                               className="w-100 h-100 object-fit-cover"/>
                    )}
                </Stack>
                <Card.Body className="position-relative pt-5 d-flex justify-content-between align-items-end">
                    <Stack>
                        {user.profilePhoto ? (
                            <Image src={`data:image/webp;base64,${user.profilePhoto}`} alt="Profile"
                                   className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"/>
                        ) : (
                            <Stack
                                className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar d-flex align-items-center justify-content-center">
                                <BootstrapIcon name="person" className="fs-1 text-muted" />
                            </Stack>
                        )}
                        <Stack className="mt-3">
                            <Card.Title as="h2" className="mb-0 profile-theme-text fw-bold">{user.firstName} {user.lastName}</Card.Title>
                            <Card.Text as="p" className="text-muted mb-0">@{user.link}</Card.Text>
                        </Stack>
                    </Stack>
                </Card.Body>
            </Card>
            <Stack direction="horizontal" className="flex-wrap gap-2 mb-4 overflow-x-auto">
                <Link to={`/users/${user.link}`} className="btn btn-profile-outline-primary">
                    <BootstrapIcon name="arrow-left" className="me-1" /> {t('profile')}
                </Link>
            </Stack>
        </>
    );
};