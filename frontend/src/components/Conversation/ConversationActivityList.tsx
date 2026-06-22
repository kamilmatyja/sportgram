import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {ConversationActivityResponse} from '../../api/responses/ConversationActivityResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {formatDate} from '../../utils/dateFormat';
import {Pagination} from '../Common/Pagination';
import BootstrapIcon from '../Common/BootstrapIcon';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Card, Stack, Form, Image, Spinner, Table} from 'react-bootstrap';

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
                                                                                      setActivitySearch
                                                                                  }) => {
    const {t} = useTranslation();
    const sortOptions: SelectOption[] = [
        {value: 'updatedAt:desc', label: t('sortCreatedDesc')},
        {value: 'updatedAt:asc', label: t('sortCreatedAsc')},
        {value: 'user:asc', label: t('sortUserAsc')},
        {value: 'user:desc', label: t('sortUserDesc')},
    ];

    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                    <Card.Title as="h4" className="mb-0 text-profile-primary fw-bold">{t('conversations')}</Card.Title>
                </Stack>

                <Stack direction="horizontal" gap={3} className="mb-3 flex-wrap align-items-center">
                    <Form.Control
                        type="text"
                        placeholder={t('search')}
                        value={activitySearch}
                        onChange={e => {
                            setActivitySearch(e.target.value);
                            setActivityPage(1);
                        }}
                        className="w-auto"
                    />
                    <Form.Select value={activitySort} onChange={e => {
                        setActivitySort(e.target.value);
                        setActivityPage(1);
                    }} className="w-auto ms-auto">
                        <SelectOptions options={sortOptions} />
                    </Form.Select>
                    <Form.Select value={activityLimit} onChange={e => {
                        setActivityLimit(Number(e.target.value));
                        setActivityPage(1);
                    }} className="w-auto">
                        <SelectOptions options={limitOptions} />
                    </Form.Select>
                </Stack>

                {loading ? (
                    <Stack className="text-center my-4 align-items-center">
                        <Spinner animation="border" className="text-profile-primary" />
                    </Stack>
                ) : (
                    <>
                        <Stack className="table-responsive-custom">
                            <Table bordered hover className="align-middle mb-0">
                                <TableHead className="table-light">
                                    <TableRow>
                                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                                        <TableHeaderCell>{t('link')}</TableHeaderCell>
                                        <TableHeaderCell>{t('lastActivity')}</TableHeaderCell>
                                        <TableHeaderCell className="text-end">{t('chat')}</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted">{t('noRecords')}</TableCell>
                                        </TableRow>
                                    ) : activities.map(act => (
                                        <TableRow key={act.otherUser.id}>
                                            <TableCell className="text-center align-middle feed-photo-cell">
                                                {act.otherUser.profilePhoto ? (
                                                    <Image
                                                        src={`data:image/webp;base64,${act.otherUser.profilePhoto}`}
                                                        alt="avatar"
                                                        roundedCircle
                                                        fluid
                                                        className="feed-photo"
                                                    />
                                                ) : (
                                                    <Stack as="span" className="text-muted">-</Stack>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Link to={`/users/${act.otherUser.link}`} className="btn btn-link p-0 text-decoration-none">
                                                    {act.otherUser.firstName} {act.otherUser.lastName}
                                                </Link>
                                            </TableCell>
                                            <TableCell>@{act.otherUser.link}</TableCell>
                                            <TableCell>{formatDate(act.updatedAt)}</TableCell>
                                            <TableCell className="text-end">
                                                <Link
                                                    to={`/users/${act.otherUser.link}/conversations`}
                                                    title={t('chat')}
                                                    className="btn btn-sm btn-profile-outline-primary"
                                                >
                                                    <BootstrapIcon name="chat-dots" className="me-1" />
                                                    <Stack as="span" className="visually-hidden">{t('chat')}</Stack>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Stack>
                        <Stack className="mt-3">
                            <Pagination
                                page={activityPage}
                                hasMore={(activityPage * activityLimit) < totalActivities}
                                onPrevPage={() => setActivityPage(Math.max(activityPage - 1, 1))}
                                onNextPage={() => setActivityPage(activityPage + 1)}
                            />
                        </Stack>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};