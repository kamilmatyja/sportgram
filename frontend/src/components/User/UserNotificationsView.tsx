import React from 'react';
import { Container, Card, Stack, Form, Spinner, Alert } from 'react-bootstrap';

import { UserSubpageHeader } from './UserSubpageHeader';
import { NotificationFilterQuery } from '../../api/queries/NotificationFilterQuery';
import { NotificationResponse } from '../../api/responses/NotificationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { Pagination } from '../Common/Pagination';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';
import { UserNotificationsTable } from '../Notification/UserNotificationsTable';

interface UserNotificationsViewProps {
    user: UserResponse | null;
    notifications: NotificationResponse[];
    isMyProfile: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: NotificationFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onManageClick: (notification: NotificationResponse) => void;
}

export const UserNotificationsView: React.FC<UserNotificationsViewProps> = ({
    user,
    notifications,
    isMyProfile,
    loading,
    error,
    page,
    limit,
    sort,
    filters,
    onFilterChange,
    onSortChange,
    onLimitChange,
    onPrevPage,
    onNextPage,
    onManageClick,
}) => {
    const { t } = useTranslation();
    const sortOptions: SelectOption[] = [
        { value: 'createdAt:desc', label: `${t('createdAt')} Z-A` },
        { value: 'createdAt:asc', label: `${t('createdAt')} A-Z` },
        { value: 'text:desc', label: `${t('text')} Z-A` },
        { value: 'text:asc', label: `${t('text')} A-Z` },
        { value: 'status:desc', label: `${t('status')} Z-A` },
        { value: 'status:asc', label: `${t('status')} A-Z` },
    ];
    if (loading && notifications.length === 0)
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
                    <Card.Title as="h4" className="mb-4 text-profile-primary fw-bold">
                        {t('notifications')}
                    </Card.Title>
                    <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap align-items-center">
                        <Form.Control
                            name="text"
                            placeholder={t('text')}
                            value={filters.text || ''}
                            onChange={onFilterChange}
                            className="w-auto"
                        />
                        <Form.Select
                            name="status"
                            value={filters.status || ''}
                            onChange={onFilterChange}
                            className="w-auto"
                        >
                            <SelectOptions
                                options={NotificationStatusEnum.getOptions(t) as any}
                                placeholder={t('status')}
                            />
                        </Form.Select>
                        <Form.Select value={sort} onChange={onSortChange} className="ms-auto w-auto">
                            <SelectOptions options={sortOptions} />
                        </Form.Select>
                        <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                            <SelectOptions options={PaginationEnum.getOptions(t) as any} />
                        </Form.Select>
                    </Stack>
                    <UserNotificationsTable
                        notifications={notifications}
                        isMyProfile={isMyProfile}
                        onManageClick={onManageClick}
                    />
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={notifications.length >= limit}
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
