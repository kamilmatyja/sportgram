import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {StatisticFilterQuery} from '../../api/queries/StatisticFilterQuery';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {Row, Col, Form, Stack} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

interface StatisticsFilterBarProps {
    filters: StatisticFilterQuery;
    sort: string;
    limit: number;
    activeTab: 'records' | 'progress';
    availableUsers: UserResponse[];
    currentUser: UserResponse | null;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onUsersChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const StatisticsFilterBar: React.FC<StatisticsFilterBarProps> = ({
                                                                            filters,
                                                                            sort,
                                                                            limit,
                                                                            activeTab,
                                                                            availableUsers,
                                                                            currentUser,
                                                                            onFilterChange,
                                                                            onUsersChange,
                                                                            onSortChange,
                                                                            onLimitChange
                                                                        }) => {
    const {t} = useTranslation();

    const userOptions: SelectOption[] = availableUsers.map(u => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} ${currentUser && u.id === currentUser.id ? `(${t('profile')})` : ''}`
    }));

    const disciplineOptions = DisciplineEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];

    const recordsSortOptions: SelectOption[] = [
        {value: 'time:asc', label: `${t('timeSeconds')} 0-9`},
        {value: 'time:desc', label: `${t('timeSeconds')} 9-0`},
        {value: 'distance:desc', label: `${t('distance')} 9-0`},
        {value: 'distance:asc', label: `${t('distance')} 0-9`}
    ];

    const progressSortOptions: SelectOption[] = [
        {value: 'createdAt:desc', label: t('sortCreatedDesc')},
        {value: 'createdAt:asc', label: t('sortCreatedAsc')},
        {value: 'time:desc', label: `${t('timeSeconds')} 9-0`},
        {value: 'time:asc', label: `${t('timeSeconds')} 0-9`}
    ];

    const sortOptions = activeTab === 'progress' ? progressSortOptions : recordsSortOptions;

    return (
        <Row className="mb-4">
            <Col xs={12} lg={3} className="mb-3 mb-lg-0">
                <Form.Group>
                    <Form.Label className="fw-bold">{t('selectFriends')}</Form.Label>
                    <Form.Select multiple value={filters.userIds || []} onChange={onUsersChange}>
                        <SelectOptions options={userOptions} />
                    </Form.Select>
                </Form.Group>
            </Col>

            <Col xs={12} lg={9} className="d-flex flex-wrap gap-3 align-items-end">
                <Form.Group>
                    <Form.Label className="small text-muted mb-1">{t('discipline')}</Form.Label>
                    <Form.Select name="discipline" value={filters.discipline || ''} onChange={onFilterChange as any} className="w-auto">
                        <SelectOptions options={disciplineOptions} placeholder={t('selectOption')} />
                    </Form.Select>
                </Form.Group>

                <Form.Group>
                    <Form.Label className="small text-muted mb-1">{t('distance')}</Form.Label>
                    <Form.Control type="number" name="distance" placeholder={t('distanceMeters')}
                                  value={filters.distance || ''} onChange={onFilterChange as any} className="w-auto" />
                </Form.Group>

                <Stack direction="horizontal" gap={3} className="ms-auto">
                    <Form.Group>
                        <Form.Label className="small text-muted mb-1">{t('sortCreatedDesc').split(' ')[0]}</Form.Label>
                        <Form.Select value={sort} onChange={onSortChange as any} className="w-auto">
                            <SelectOptions options={sortOptions} />
                        </Form.Select>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label className="small text-muted mb-1">{t('page')}</Form.Label>
                        <Form.Select value={limit} onChange={onLimitChange as any} className="w-auto">
                            <SelectOptions options={limitOptions} />
                        </Form.Select>
                    </Form.Group>
                </Stack>
            </Col>
        </Row>
    );
};