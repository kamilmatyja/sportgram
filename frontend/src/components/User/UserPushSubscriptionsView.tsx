import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PushSubscriptionFilterQuery} from '../../api/queries/PushSubscriptionFilterQuery';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserSubpageHeader} from './UserSubpageHeader';
import {Pagination} from '../Common/Pagination';
import {UserPushSubscriptionsTable} from '../PushSubscription/UserPushSubscriptionsTable';
import {Container, Card, Stack, Button, Form, Spinner, Alert} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

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
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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
                                                                                        filters,
                                                                                        onFilterChange,
                                                                                        onSortChange,
                                                                                        onLimitChange,
                                                                                        onPrevPage,
                                                                                        onNextPage,
                                                                                        onAddClick,
                                                                                        onManageClick
                                                                                    }) => {
    const {t} = useTranslation();

    if (loading && subscriptions.length === 0) return (
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
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        {value: 'createdAt:desc', label: t('sortCreatedDesc')},
        {value: 'createdAt:asc', label: t('sortCreatedAsc')},
        {value: 'endpoint:asc', label: `${t('endpoint')} A-Z`},
        {value: 'endpoint:desc', label: `${t('endpoint')} Z-A`},
    ];

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user}/>

            <Card className="shadow-sm">
                <Card.Body>
                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                        <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">{t('pushSubscriptions')}</Card.Title>
                        {isMyProfile && (
                            <Button variant="profile-primary" onClick={onAddClick}>
                                {t('addSubscription')}
                            </Button>
                        )}
                    </Stack>

                    <Stack direction="horizontal" gap={3} className="mb-3 flex-wrap align-items-center">
                        <Form.Control
                            name="endpoint"
                            placeholder={t('endpoint')}
                            value={filters.endpoint || ''}
                            onChange={e => onFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                            className="w-auto"
                        />
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
                            <UserPushSubscriptionsTable
                                subscriptions={subscriptions}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                onManageClick={onManageClick}
                            />
                            <Stack className="mt-3">
                                <Pagination page={page} hasMore={subscriptions.length >= limit} onPrevPage={onPrevPage}
                                            onNextPage={onNextPage}/>
                            </Stack>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};