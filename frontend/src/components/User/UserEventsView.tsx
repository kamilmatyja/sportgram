import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserSubpageHeader} from './UserSubpageHeader';
import {Pagination} from '../Common/Pagination';
import {UserEventsTable} from '../Event/UserEventsTable';
import {Container, Card, Stack, Button, Form, Spinner, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

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
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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
                                                                  interactions
                                                              }) => {
    const {t} = useTranslation();

    if (loading && events.length === 0) return (
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
    const statusOptions = ElementStatusEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        {value: 'createdAt:desc', label: t('sortCreatedDesc')},
        {value: 'createdAt:asc', label: t('sortCreatedAsc')},
        {value: 'startedAt:desc', label: `${t('startedAt')} Z-A`},
        {value: 'startedAt:asc', label: `${t('startedAt')} A-Z`},
    ];

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user}/>

            <Card className="shadow-sm">
                <Card.Body>
                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                        <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">{t('events')}</Card.Title>
                        {(isMyProfile && isOrganizer) && (
                            <Button variant="profile-primary" onClick={onAddClick}>
                                {t('addEvent')}
                            </Button>
                        )}
                    </Stack>

                    <Stack direction="horizontal" gap={3} className="mb-3 flex-wrap align-items-center">
                        <Form.Control
                            name="title"
                            placeholder={t('title')}
                            value={filters.title || ''}
                            onChange={e => onFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                            className="w-auto"
                        />
                        <Form.Control
                            name="link"
                            placeholder={t('link')}
                            value={filters.link || ''}
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
                            <UserEventsTable
                                events={events}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                actionLoading={interactions.actionLoading}
                                onManageClick={onManageClick}
                                interactions={interactions}
                            />
                            <Stack className="mt-3">
                                <Pagination page={page} hasMore={events.length >= limit} onPrevPage={onPrevPage}
                                            onNextPage={onNextPage}/>
                            </Stack>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};