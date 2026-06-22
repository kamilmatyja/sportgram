import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {NotificationFilterQuery} from '../../api/queries/NotificationFilterQuery';
import {NotificationStatusEnum} from '../../enums/NotificationStatusEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserSubpageHeader} from './UserSubpageHeader';
import {Pagination} from '../Common/Pagination';
import {UserNotificationsTable} from '../Notification/UserNotificationsTable';
import {Container, Card, Stack, Form, Spinner, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

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
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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
                                                                                onManageClick
                                                                            }) => {
    const {t} = useTranslation();

    if (loading && notifications.length === 0) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" className="text-profile-primary" />
        </Container>
    );
    if (error || !user) return (
        <Container className="mt-5">
            <Alert variant="danger">{error ? t(error) : t('userNotFound')}</Alert>
        </Container>
    );

    const themeClass = ColorEnum.getClass(user.color);
    const statusOptions = NotificationStatusEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        {value: 'createdAt:desc', label: t('sortCreatedDesc')},
        {value: 'createdAt:asc', label: t('sortCreatedAsc')},
    ];

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user}/>

            <Card className="shadow-sm">
                <Card.Body>
                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                        <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">{t('notifications')}</Card.Title>
                    </Stack>

                    <Stack direction="horizontal" gap={3} className="mb-3 flex-wrap align-items-center">
                        <Form.Control
                            name="text"
                            placeholder={t('text')}
                            value={filters.text || ''}
                            onChange={e => onFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                            className="w-auto"
                        />
                        <Form.Select name="status" value={filters.status || ''} onChange={onFilterChange}
                                     className="w-auto">
                            <SelectOptions options={statusOptions} placeholder={t('status')} />
                        </Form.Select>
                        <Form.Select value={sort} onChange={onSortChange} className="w-auto ms-auto">
                            <SelectOptions options={sortOptions} />
                        </Form.Select>
                        <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                            <SelectOptions options={limitOptions} />
                        </Form.Select>
                    </Stack>

                    {loading ? (
                        <Stack className="text-center my-4">
                            <Spinner animation="border" className="text-profile-primary"/>
                        </Stack>
                    ) : (
                        <>
                            <UserNotificationsTable
                                notifications={notifications}
                                isMyProfile={isMyProfile}
                                onManageClick={onManageClick}
                            />
                            <Stack className="mt-3">
                                <Pagination page={page} hasMore={notifications.length >= limit} onPrevPage={onPrevPage}
                                            onNextPage={onNextPage}/>
                            </Stack>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};