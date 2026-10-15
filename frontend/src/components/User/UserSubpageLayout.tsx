import React from 'react';
import { Card, Container, Stack } from 'react-bootstrap';

import { UserSubpageHeader } from './UserSubpageHeader';
import { UserResponse } from '../../api/responses/UserResponse';
import { ColorEnum } from '../../enums/ColorEnum';
import { FilterBar } from '../Common/FilterBar';
import { Pagination } from '../Common/Pagination';
import { SectionHeader } from '../Common/SectionHeader';
import { ErrorView, LoadingView } from '../Common/ViewState';

interface UserSubpageLayoutProps {
    user: UserResponse | null;
    title: React.ReactNode;
    actions?: React.ReactNode;
    filters: React.ReactNode;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    children: React.ReactNode;
}

export const UserSubpageLayout: React.FC<UserSubpageLayoutProps> = ({
    user,
    title,
    actions,
    filters,
    loading,
    error,
    page,
    hasMore,
    onPrevPage,
    onNextPage,
    children,
}) => {
    if (loading) return <LoadingView />;
    if (error || !user) return <ErrorView error={error || 'userNotFound'} />;

    return (
        <Container className={`mt-4 mb-5 ${ColorEnum.getClass(user.color)}`}>
            <UserSubpageHeader user={user} />
            <Card className="shadow-sm">
                <Card.Body>
                    <SectionHeader title={title} actions={actions} />
                    <FilterBar>{filters}</FilterBar>
                    {children}
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={hasMore}
                            onPrevPage={onPrevPage}
                            onNextPage={onNextPage}
                            variant="profile-outline-primary"
                        />
                    </Stack>
                </Card.Body>
            </Card>
        </Container>
    );
};
