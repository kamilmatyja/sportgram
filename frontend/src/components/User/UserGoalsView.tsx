import React from 'react';
import { Container, Card, Stack, Button, Form, Spinner, Alert } from 'react-bootstrap';

import { UserSubpageHeader } from './UserSubpageHeader';
import { GoalFilterQuery } from '../../api/queries/GoalFilterQuery';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { Pagination } from '../Common/Pagination';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';
import { UserGoalsTable } from '../Goal/UserGoalsTable';

interface UserGoalsViewProps {
    user: UserResponse | null;
    goals: GoalResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipant: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: GoalFilterQuery;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (goal: GoalResponse) => void;
    interactions: any;
}

export const UserGoalsView: React.FC<UserGoalsViewProps> = ({
    user,
    goals,
    relatedUsers,
    isMyProfile,
    isAdmin,
    isParticipant,
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
        { value: 'text:desc', label: `${t('title')} Z-A` },
        { value: 'text:asc', label: `${t('title')} A-Z` },
        { value: 'discipline:desc', label: `${t('discipline')} Z-A` },
        { value: 'discipline:asc', label: `${t('discipline')} A-Z` },
        { value: 'distance:desc', label: `${t('distance')} 9-0` },
        { value: 'distance:asc', label: `${t('distance')} 0-9` },
        { value: 'time:desc', label: `${t('timeSeconds')} 9-0` },
        { value: 'time:asc', label: `${t('timeSeconds')} 0-9` },
        { value: 'status:desc', label: `${t('status')} Z-A` },
        { value: 'status:asc', label: `${t('status')} A-Z` },
    ];
    if (loading && goals.length === 0)
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
                            {t('goals')}
                        </Card.Title>
                        {isMyProfile && isParticipant && (
                            <Button variant="profile-primary" onClick={onAddClick}>
                                {t('addGoal')}
                            </Button>
                        )}
                    </Stack>
                    <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap align-items-center">
                        <Form.Control
                            name="text"
                            placeholder={t('title')}
                            value={filters.text || ''}
                            onChange={onFilterChange}
                            className="w-auto"
                        />
                        <Form.Select
                            name="discipline"
                            value={filters.discipline || ''}
                            onChange={onFilterChange}
                            className="w-auto"
                        >
                            <SelectOptions
                                options={DisciplineEnum.getOptions(t) as any}
                                placeholder={t('discipline')}
                            />
                        </Form.Select>
                        <Form.Select
                            name="status"
                            value={filters.status || ''}
                            onChange={onFilterChange}
                            className="w-auto"
                        >
                            <SelectOptions options={GoalStatusEnum.getOptions(t) as any} placeholder={t('status')} />
                        </Form.Select>
                        <Form.Select value={sort} onChange={onSortChange} className="ms-auto w-auto">
                            <SelectOptions options={sortOptions} />
                        </Form.Select>
                        <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                            <SelectOptions options={PaginationEnum.getOptions(t) as any} />
                        </Form.Select>
                    </Stack>
                    <UserGoalsTable
                        goals={goals}
                        relatedUsers={relatedUsers}
                        isMyProfile={isMyProfile}
                        isAdmin={isAdmin}
                        onManageClick={onManageClick}
                        interactions={interactions}
                        actionLoading={interactions.actionLoading}
                    />
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={goals.length >= limit}
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
