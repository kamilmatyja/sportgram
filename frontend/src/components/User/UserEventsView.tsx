import React from 'react';
import { Container, Card, Stack, Button, Form, Spinner, Alert } from 'react-bootstrap';

import { UserSubpageHeader } from './UserSubpageHeader';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { Pagination } from '../Common/Pagination';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';
import { UserEventsTable } from '../Event/UserEventsTable';

interface UserEventsViewProps {
    user: UserResponse | null;
    events: EventResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: EventFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (eventObj: EventResponse) => void;
    interactions: any;
}

export const UserEventsView: React.FC<UserEventsViewProps> = ({
    user,
    events,
    isMyProfile,
    isAdmin,
    isOrganizer,
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
    onAddClick,
    onManageClick,
    interactions,
}) => {
    const { t } = useTranslation();
    const sortOptions: SelectOption[] = [
        { value: 'createdAt:desc', label: `${t('createdAt')} Z-A` },
        { value: 'createdAt:asc', label: `${t('createdAt')} A-Z` },
        { value: 'startedAt:desc', label: `${t('startedAt')} Z-A` },
        { value: 'startedAt:asc', label: `${t('startedAt')} A-Z` },
        { value: 'endedAt:desc', label: `${t('endedAt')} Z-A` },
        { value: 'endedAt:asc', label: `${t('endedAt')} A-Z` },
        { value: 'title:desc', label: `${t('title')} Z-A` },
        { value: 'title:asc', label: `${t('title')} A-Z` },
        { value: 'location:desc', label: `${t('location')} Z-A` },
        { value: 'location:asc', label: `${t('location')} A-Z` },
        { value: 'status:desc', label: `${t('status')} Z-A` },
        { value: 'status:asc', label: `${t('status')} A-Z` },
    ];
    if (loading && events.length === 0)
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
                            {t('events')}
                        </Card.Title>
                        {isMyProfile && isOrganizer && (
                            <Button variant="profile-primary" onClick={onAddClick}>
                                {t('addEvent')}
                            </Button>
                        )}
                    </Stack>
                    <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap align-items-center">
                        <Form.Control
                            name="title"
                            placeholder={t('title')}
                            value={filters.title || ''}
                            onChange={onFilterChange}
                            className="w-auto"
                        />
                        <Form.Select
                            name="status"
                            value={filters.status || ''}
                            onChange={onFilterChange}
                            className="w-auto"
                        >
                            <SelectOptions options={ElementStatusEnum.getOptions(t) as any} placeholder={t('status')} />
                        </Form.Select>
                        <Form.Select value={sort} onChange={onSortChange} className="w-auto ms-auto">
                            <SelectOptions options={sortOptions} />
                        </Form.Select>
                        <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                            <SelectOptions options={PaginationEnum.getOptions(t) as any} />
                        </Form.Select>
                    </Stack>
                    <UserEventsTable
                        events={events}
                        isMyProfile={isMyProfile}
                        isAdmin={isAdmin}
                        onManageClick={onManageClick}
                        interactions={interactions}
                        actionLoading={interactions.actionLoading}
                    />
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={events.length >= limit}
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
