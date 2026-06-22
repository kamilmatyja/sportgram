import React from 'react';
import {PageResponse} from '../../api/responses/PageResponse';
import {Card, Image, Stack} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface PageHeaderProps {
    pageObj: PageResponse;
}

export const PageHeader: React.FC<PageHeaderProps> = ({pageObj}) => {
    return (
        <Card className="shadow-sm mb-4">
            <Stack className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                {pageObj.backgroundPhoto && (
                    <Image src={`data:image/webp;base64,${pageObj.backgroundPhoto}`} alt="Background"
                           className="w-100 h-100 object-fit-cover"/>
                )}
            </Stack>
            <Card.Body className="position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                <Stack>
                    {pageObj.profilePhoto ? (
                        <Image src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="Profile"
                               className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"/>
                    ) : (
                        <Stack className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar align-items-center justify-content-center">
                            <BootstrapIcon name="file-earmark-text" className="fs-1 text-muted" />
                        </Stack>
                    )}
                    <Stack className="mt-4 mt-md-3">
                        <Card.Text as="h2" className="mb-0 profile-theme-text fw-bold">{pageObj.title}</Card.Text>
                        <Card.Text as="p" className="text-muted mb-0">@{pageObj.link}</Card.Text>
                    </Stack>
                </Stack>
            </Card.Body>
        </Card>
    );
};