import { SimpleGrid, TextInput, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

export interface TextStatusFilterGridProps {
    text: string;
    onTextChange: (val: string) => void;
    status: string | null;
    onStatusChange: (val: string | null) => void;
    onFilterChange?: () => void;
}

export function TextStatusFilterGrid({
    text,
    onTextChange,
    status,
    onStatusChange,
    onFilterChange,
}: TextStatusFilterGridProps) {
    const { t } = useTranslation();

    return (
        <SimpleGrid>
            <TextInput
                label={t('text')}
                placeholder={t('search')}
                value={text}
                onChange={(e) => {
                    onTextChange(e.currentTarget.value);
                    onFilterChange?.();
                }}
            />
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={ElementStatusEnum.getOptions(t).map((s) => ({
                    value: String(s.value),
                    label: s.label,
                }))}
                value={status}
                onChange={(v) => {
                    onStatusChange(v);
                    onFilterChange?.();
                }}
                clearable
            />
        </SimpleGrid>
    );
}
