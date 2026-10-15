import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';

import { StatisticFilterQuery } from '../../api/queries/StatisticFilterQuery';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { buildSortOptions } from '../../utils/options';
import { formatUserName } from '../../utils/user';
import { FilterBar, FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

interface StatisticsFilterBarProps {
    filters: StatisticFilterQuery;
    sort: string;
    limit: number;
    availableUsers: UserResponse[];
    currentUser: UserResponse | null;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onUsersChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const StatisticsFilterBar: React.FC<StatisticsFilterBarProps> = ({
    filters,
    sort,
    limit,
    availableUsers,
    currentUser,
    onFilterChange,
    onUsersChange,
    onSortChange,
    onLimitChange,
}) => {
    const { t } = useTranslation();

    const userOptions: SelectOption[] = availableUsers.map((u) => ({
        value: u.id,
        label: `${formatUserName(u)} ${currentUser && u.id === currentUser.id ? `(${t('profile')})` : ''}`,
    }));

    const sortOptions = buildSortOptions(t, [
        'createdAt',
        'discipline',
        { field: 'distance', numeric: true },
        { field: 'time', label: 'timeSeconds', numeric: true },
    ]);

    return (
        <Row className="g-3 mb-3">
            <Col xs={12} lg={3}>
                <Form.Group>
                    <Form.Label className="fw-bold small">{t('selectFriends')}</Form.Label>
                    <Form.Select multiple value={filters.userIds || []} onChange={onUsersChange}>
                        <SelectOptions options={userOptions} />
                    </Form.Select>
                </Form.Group>
            </Col>

            <Col xs={12} lg={9}>
                <FilterBar>
                    <FilterSelect
                        name="discipline"
                        value={filters.discipline || ''}
                        onChange={onFilterChange}
                        options={DisciplineEnum.getOptions(t)}
                        placeholder={t('discipline')}
                    />
                    <FilterInput
                        type="number"
                        name="distance"
                        placeholder={t('distanceMeters')}
                        value={filters.distance || ''}
                        onChange={onFilterChange}
                    />
                    <SortLimitSelect
                        sortOptions={sortOptions}
                        sort={sort}
                        limit={limit}
                        onSortChange={onSortChange}
                        onLimitChange={onLimitChange}
                    />
                </FilterBar>
            </Col>
        </Row>
    );
};
