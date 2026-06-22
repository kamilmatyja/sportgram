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
import {Card, Stack, Form, Image, Spinner, Row, Col, Alert} from 'react-bootstrap';

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
                        <Stack gap={2} className="table-responsive-custom">
                            <Row className="g-2 px-2 py-2 rounded bg-light fw-semibold text-muted">
                                <Col xs={2} sm={1}>{t('photo')}</Col>
                                <Col xs={5} sm={4}>{t('user')}</Col>
                                <Col xs={5} sm={3}>{t('link')}</Col>
                                <Col sm={3} className="d-none d-sm-block">{t('lastActivity')}</Col>
                                <Col sm={1} className="d-none d-sm-block" />
                            </Row>

                            {activities.length === 0 ? (
                                <Alert variant="light" className="mb-0 text-center text-muted">{t('noRecords')}</Alert>
                            ) : activities.map(act => (
                                <Card key={act.otherUser.id} className="border-0 shadow-sm">
                                    <Card.Body className="py-2 px-3">
                                        <Row className="g-2 align-items-center">
                                            <Col xs={2} sm={1} className="text-center feed-photo-cell">
                                                {act.otherUser.profilePhoto ? (
                                                    <Image
                                                        src={`data:image/webp;base64,${act.otherUser.profilePhoto}`}
                                                        alt="avatar"
                                                        roundedCircle
                                                        fluid
                                                        className="feed-photo"
                                                    />
                                                ) : (
                                                    <Stack className="text-muted align-items-center">-</Stack>
                                                )}
                                            </Col>
                                            <Col xs={5} sm={4}>
                                                <Link to={`/users/${act.otherUser.link}`}
                                                      className="btn btn-link p-0 text-decoration-none">
                                                    {act.otherUser.firstName} {act.otherUser.lastName}
                                                </Link>
                                            </Col>
                                            <Col xs={5} sm={3}>@{act.otherUser.link}</Col>
                                            <Col sm={3} className="d-none d-sm-block">{formatDate(act.updatedAt)}</Col>
                                            <Col sm={1} className="d-none d-sm-flex justify-content-end">
                                                <Link to={`/users/${act.otherUser.link}/conversations`} title={t('chat')}
                                                      className="btn btn-sm btn-profile-outline-primary">
                                                    <BootstrapIcon name="chat-dots" className="me-1" />
                                                    <Stack as="span" className="visually-hidden">{t('chat')}</Stack>
                                                </Link>
                                            </Col>
                                            <Col xs={12} className="d-sm-none">
                                                <Stack direction="horizontal" className="justify-content-between align-items-center">
                                                    <Card.Text className="mb-0 text-muted">{formatDate(act.updatedAt)}</Card.Text>
                                                    <Link to={`/users/${act.otherUser.link}/conversations`} title={t('chat')}
                                                          className="btn btn-sm btn-profile-outline-primary">
                                                        <BootstrapIcon name="chat-dots" className="me-1" />
                                                        <Stack as="span" className="visually-hidden">{t('chat')}</Stack>
                                                    </Link>
                                                </Stack>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))}
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