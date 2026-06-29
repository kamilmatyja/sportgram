import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { ConversationActivityResponse } from '../../api/responses/ConversationActivityResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { formatDate } from '../../utils/dateFormat';
import { Pagination } from '../Common/Pagination';
import BootstrapIcon from '../Common/BootstrapIcon';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';
import { Card, Stack, Form, Image, Spinner, Table } from 'react-bootstrap';

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
                                                                                      activities, totalActivities, activityPage, activityLimit, activitySort,
                                                                                      activitySearch, loading, setActivityPage, setActivityLimit, setActivitySort, setActivitySearch
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
                <h4 className="fw-bold mb-4">{t('conversations')}</h4>

                <Stack direction="horizontal" gap={2} className="mb-4 flex-wrap">
                    <Form.Control
                        placeholder={t('search')}
                        value={activitySearch}
                        onChange={e => { setActivitySearch(e.target.value); setActivityPage(1); }}
                        style={{ maxWidth: '250px' }}
                    />
                    <Form.Select value={activitySort} onChange={e => { setActivitySort(e.target.value); setActivityPage(1); }} style={{ width: 'auto' }} className="ms-auto">
                        <SelectOptions options={sortOptions} />
                    </Form.Select>
                    <Form.Select value={activityLimit} onChange={e => { setActivityLimit(Number(e.target.value)); setActivityPage(1); }} style={{ width: 'auto' }}>
                        <SelectOptions options={PaginationEnum.getOptions(t) as any} />
                    </Form.Select>
                </Stack>

                {loading ? (
                    <Stack className="align-items-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </Stack>
                ) : (
                    <>
                        <Table responsive hover className="align-middle">
                            <thead className="table-light">
                            <tr>
                                <th>{t('user')}</th>
                                <th>{t('lastActivity')}</th>
                                <th className="text-end">{t('chat')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {activities.length === 0 ? (
                                <tr><td colSpan={3} className="text-center py-4 text-muted">{t('noRecords')}</td></tr>
                            ) : activities.map(act => (
                                <tr key={act.otherUser.id}>
                                    <td>
                                        <Stack direction="horizontal" gap={3}>
                                            {act.otherUser.profilePhoto ? (
                                                <Image src={`data:image/webp;base64,${act.otherUser.profilePhoto}`}
                                                       roundedCircle style={{ width: 40, height: 40, objectFit: 'cover' }} />
                                            ) : (
                                                <div className="bg-secondary rounded-circle" style={{ width: 40, height: 40 }} />
                                            )}
                                            <Link to={`/users/${act.otherUser.link}`} className="text-decoration-none fw-bold text-dark">
                                                {act.otherUser.firstName} {act.otherUser.lastName}
                                            </Link>
                                        </Stack>
                                    </td>
                                    <td className="text-muted small">{formatDate(act.updatedAt)}</td>
                                    <td className="text-end">
                                        <Link to={`/users/${act.otherUser.link}/conversations`} className="outline-primary">
                                            <BootstrapIcon name="chat-dots" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                        <Pagination
                            page={activityPage}
                            hasMore={(activityPage * activityLimit) < totalActivities}
                            onPrevPage={() => setActivityPage(Math.max(activityPage - 1, 1))}
                            onNextPage={() => setActivityPage(activityPage + 1)}
                        />
                    </>
                )}
            </Card.Body>
        </Card>
    );
};