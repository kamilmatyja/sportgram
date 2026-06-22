import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import BootstrapIcon from '../Common/BootstrapIcon';
import {Card, Image, Stack} from 'react-bootstrap';

interface EventPageHeaderProps {
    ownerPage: PageResponse;
}

export const EventPageHeader: React.FC<EventPageHeaderProps> = ({ownerPage}) => {
    const {t} = useTranslation();

    return (
        <>
            <Card className="shadow-sm mb-4">
                <Stack className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    {ownerPage.backgroundPhoto && (
                        <Image src={`data:image/webp;base64,${ownerPage.backgroundPhoto}`} alt="Background" className="w-100 h-100 object-fit-cover" />
                    )}
                </Stack>
                <Card.Body className="position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                    <Stack>
                        {ownerPage.profilePhoto ? (
                            <Image src={`data:image/webp;base64,${ownerPage.profilePhoto}`} alt="Profile" className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover" />
                        ) : (
                            <Stack className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar align-items-center justify-content-center">
                                <BootstrapIcon name="file-earmark-text" className="fs-1 text-muted" />
                            </Stack>
                        )}
                        <Stack className="mt-4 mt-md-3">
                            <Card.Text as="p" className="mb-0 profile-theme-text fw-bold fs-2">{ownerPage.title}</Card.Text>
                            <Card.Text className="text-muted mb-0">@{ownerPage.link}</Card.Text>
                        </Stack>
                    </Stack>
                </Card.Body>
            </Card>

            <Stack direction="horizontal" className="flex-wrap gap-2 mb-4 overflow-x-auto">
                <Link to="/events" className="btn btn-profile-outline-primary">
                    <BootstrapIcon name="arrow-left" className="me-1" /> {t('events')}
                </Link>
            </Stack>
        </>
    );
};