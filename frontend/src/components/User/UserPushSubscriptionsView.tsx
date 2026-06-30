import React from 'react';
import { Container, Card, Stack, Button, Form, Spinner, Alert } from 'react-bootstrap';

import { UserSubpageHeader } from './UserSubpageHeader';
import { PushSubscriptionFilterQuery } from '../../api/queries/PushSubscriptionFilterQuery';
import { PushSubscriptionResponse } from '../../api/responses/PushSubscriptionResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { Pagination } from '../Common/Pagination';
import SelectOptions from '../Common/SelectOptions';
import { UserPushSubscriptionsTable } from '../PushSubscription/UserPushSubscriptionsTable';

interface UserPushSubscriptionsViewProps {
    user: UserResponse | null;
    subscriptions: PushSubscriptionResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: PushSubscriptionFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (subscription: PushSubscriptionResponse) => void;
}

export const UserPushSubscriptionsView: React.FC<UserPushSubscriptionsViewProps> = ({
    user,
    subscriptions,
    isMyProfile,
    isAdmin,
    loading,
    error,
    page,
    limit,
    sort,
    onSortChange,
    onLimitChange,
    onPrevPage,
    onNextPage,
    onAddClick,
    onManageClick,
}) => {
    const { t } = useTranslation();
    if (loading && subscriptions.length === 0)
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    if (error || !user)
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error ? t(error) : t('userNotFound')}</Alert>
            </Container>
        );

    const themeClass = ColorEnum.getClass(user.color);
    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user} />
            <Card className="shadow-sm">
                <Card.Body>
                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                        <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">
                            {t('pushSubscriptions')}
                        </Card.Title>
                        {isMyProfile && (
                            <Button variant="profile-primary" onClick={onAddClick}>
                                {t('addSubscription')}
                            </Button>
                        )}
                    </Stack>
                    <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap">
                        <Form.Select value={sort} onChange={onSortChange} className="ms-auto w-auto">
                            <SelectOptions
                                options={
                                    [
                                        { value: 'createdAt:desc', label: t('sortCreatedDesc') },
                                        { value: 'createdAt:asc', label: t('sortCreatedAsc') },
                                    ] as any
                                }
                            />
                        </Form.Select>
                        <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                            <SelectOptions options={PaginationEnum.getOptions(t) as any} />
                        </Form.Select>
                    </Stack>
                    <UserPushSubscriptionsTable
                        subscriptions={subscriptions}
                        isMyProfile={isMyProfile}
                        isAdmin={isAdmin}
                        onManageClick={onManageClick}
                    />
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={subscriptions.length >= limit}
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
