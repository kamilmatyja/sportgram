import { type FC, type ReactNode } from 'react';
import { Card, Stack } from 'react-bootstrap';

interface SectionHeaderProps {
    title: ReactNode;
    actions?: ReactNode;
}

export const SectionHeader: FC<SectionHeaderProps> = ({ title, actions }) => (
    <Stack direction="horizontal" gap={2} className="justify-content-between align-items-center flex-wrap mb-4">
        <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
            {title}
        </Card.Title>
        {actions}
    </Stack>
);
