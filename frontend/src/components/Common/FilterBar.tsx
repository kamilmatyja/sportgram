import { type ChangeEvent, type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { Form, Stack } from 'react-bootstrap';

import SelectOptions, { type SelectOption } from './SelectOptions';
import { useTranslation } from '../../context/TranslationContext';
import { PaginationEnum } from '../../enums/PaginationEnum';

export const FilterBar: FC<{ children: ReactNode }> = ({ children }) => (
    <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap align-items-center">
        {children}
    </Stack>
);

export const FilterInput: FC<ComponentPropsWithoutRef<typeof Form.Control>> = ({ className = '', ...props }) => (
    <Form.Control {...props} className={`w-auto ${className}`.trim()} />
);

type FilterSelectProps = ComponentPropsWithoutRef<typeof Form.Select> & {
    options: SelectOption[];
    placeholder?: string;
};

export const FilterSelect: FC<FilterSelectProps> = ({ options, placeholder, className = '', ...props }) => (
    <Form.Select {...props} className={`w-auto ${className}`.trim()}>
        <SelectOptions options={options} placeholder={placeholder} />
    </Form.Select>
);

interface SortLimitSelectProps {
    sortOptions: SelectOption[];
    sort: string;
    limit: number;
    onSortChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export const SortLimitSelect: FC<SortLimitSelectProps> = ({
    sortOptions,
    sort,
    limit,
    onSortChange,
    onLimitChange,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <FilterSelect value={sort} onChange={onSortChange} options={sortOptions} className="ms-auto" />
            <FilterSelect value={limit} onChange={onLimitChange} options={PaginationEnum.getOptions(t)} />
        </>
    );
};
