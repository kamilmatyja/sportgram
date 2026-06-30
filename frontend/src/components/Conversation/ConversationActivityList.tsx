import React from 'react';
import { Card, Stack, Form, Image, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { ConversationActivityResponse } from '../../api/responses/ConversationActivityResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { Pagination } from '../Common/Pagination';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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

    const sortOptions: SelectOption[] = [
        { value: 'updatedAt:desc', label: t('sortCreatedDesc') },
        { value: 'updatedAt:asc', label: t('sortCreatedAsc') },
        { value: 'user:asc', label: t('sortUserAsc') },
        { value: 'user:desc', label: t('sortUserDesc') },
    ];

    return (
        <Card className="shadow-sm border-0">
            <Card.Body>
                <Card.Title as="h4" className="mb-4 text-profile-primary fw-bold">
                    {t('conversations')}
                </Card.Title>

                <Stack direction="horizontal" gap={2} className="mb-4 flex-wrap">
                    <Form.Control
                        placeholder={t('search')}
                        value={activitySearch}
                        onChange={(e) => {
                            setActivitySearch(e.target.value);
                            setActivityPage(1);
                        }}
                        className="w-auto"
                    />
                    <Form.Select
                        value={activitySort}
                        onChange={(e) => {
                            setActivitySort(e.target.value);
                            setActivityPage(1);
                        }}
                        className="w-auto ms-auto"
                    >
                        <SelectOptions options={sortOptions} />
                    </Form.Select>
                    <Form.Select
                        value={activityLimit}
                        onChange={(e) => {
                            setActivityLimit(Number(e.target.value));
                            setActivityPage(1);
                        }}
                        className="w-auto"
                    >
                        <SelectOptions options={PaginationEnum.getOptions(t) as any} />
                    </Form.Select>
                </Stack>

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
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted py-4">
                                                {t('noRecords')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.map((act) => (
                                            <TableRow key={act.otherUser.id}>
                                                <TableCell>
                                                    <Stack
                                                        direction="horizontal"
                                                        gap={3}
                                                        className="align-items-center"
                                                    >
                                                        {act.otherUser.profilePhoto ? (
                                                            <Image
                                                                src={`data:image/webp;base64,${act.otherUser.profilePhoto}`}
                                                                roundedCircle
                                                                className="feed-avatar-32 object-fit-cover"
                                                            />
                                                        ) : (
                                                            <Stack className="bg-secondary rounded-circle feed-avatar-32" />
                                                        )}
                                                        <Link
                                                            to={`/users/${act.otherUser.link}`}
                                                            className="text-decoration-none"
                                                        >
                                                            {act.otherUser.firstName} {act.otherUser.lastName}
                                                        </Link>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack as="small" className="text-muted">
                                                        {formatDate(act.updatedAt)}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <Link
                                                        to={`/users/${act.otherUser.link}/conversations`}
                                                        className="btn btn-profile-outline-primary btn-sm rounded-circle shadow-sm"
                                                    >
                                                        <BootstrapIcon name="chat-dots" />
                                                    </Link>
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
