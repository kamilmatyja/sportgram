import React from 'react';
import { Card, Stack, Spinner, Table } from 'react-bootstrap';

import { ConversationActivityResponse } from '../../api/responses/ConversationActivityResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { formatDate } from '../../utils/dateFormat';
import { buildSortOptions } from '../../utils/options';
import { FilterBar, FilterInput, SortLimitSelect } from '../Common/FilterBar';
import { IconButton } from '../Common/IconButton';
import { Pagination } from '../Common/Pagination';
import { SectionHeader } from '../Common/SectionHeader';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';
import { UserAvatar } from '../Common/UserAvatar';
import { UserLink } from '../Common/UserLink';

interface ConversationActivityListProps {
    activities: (ConversationActivityResponse & { otherUser: UserResponse })[];
    totalActivities: number;
    activityPage: number;
    activityLimit: number;
    activitySort: string;
    activitySearch: string;
    loading: boolean;
    setActivityPage: (page: number) => void;
    setActivityLimit: (limit: number) => void;
    setActivitySort: (sort: string) => void;
    setActivitySearch: (search: string) => void;
    paginationVariant?: string;
}

export const ConversationActivityList: React.FC<ConversationActivityListProps> = ({
    activities,
    totalActivities,
    activityPage,
    activityLimit,
    activitySort,
    activitySearch,
    loading,
    setActivityPage,
    setActivityLimit,
    setActivitySort,
    setActivitySearch,
    paginationVariant,
}) => {
    const { t } = useTranslation();
    const sortOptions = buildSortOptions(t, ['createdAt', 'updatedAt']);

    return (
        <Card className="shadow-sm border-0">
            <Card.Body>
                <SectionHeader title={t('conversations')} />

                <FilterBar>
                    <FilterInput
                        placeholder={t('search')}
                        value={activitySearch}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setActivitySearch(e.target.value);
                            setActivityPage(1);
                        }}
                    />
                    <SortLimitSelect
                        sortOptions={sortOptions}
                        sort={activitySort}
                        limit={activityLimit}
                        onSortChange={(e) => {
                            setActivitySort(e.target.value);
                            setActivityPage(1);
                        }}
                        onLimitChange={(e) => {
                            setActivityLimit(Number(e.target.value));
                            setActivityPage(1);
                        }}
                    />
                </FilterBar>

                {loading ? (
                    <Stack className="align-items-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </Stack>
                ) : (
                    <>
                        <Stack className="table-responsive-custom">
                            <Table bordered hover className="align-middle mb-0 shadow-sm">
                                <TableHead className="table-light">
                                    <TableRow>
                                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                                        <TableHeaderCell>{t('lastActivity')}</TableHeaderCell>
                                        <TableHeaderCell className="text-end">{t('chat')}</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activities.length === 0 ? (
                                        <EmptyTableRow colSpan={3} />
                                    ) : (
                                        activities.map((act) => (
                                            <TableRow key={act.otherUser.id}>
                                                <TableCell>
                                                    <Stack
                                                        direction="horizontal"
                                                        gap={3}
                                                        className="align-items-center"
                                                    >
                                                        <UserAvatar user={act.otherUser} size={32} />
                                                        <UserLink user={act.otherUser} />
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack as="small" className="text-muted">
                                                        {formatDate(act.updatedAt)}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <IconButton
                                                        icon="chat-dots"
                                                        to={`/users/${act.otherUser.link}/conversations`}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Stack>
                        <Stack className="mt-3">
                            <Pagination
                                page={activityPage}
                                hasMore={activityPage * activityLimit < totalActivities}
                                onPrevPage={() => setActivityPage(Math.max(activityPage - 1, 1))}
                                onNextPage={() => setActivityPage(activityPage + 1)}
                                variant={paginationVariant}
                            />
                        </Stack>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};
