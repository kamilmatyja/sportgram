import { Group, TextInput, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

export interface TextStatusFilterProps {
    text: string;
    onTextChange: (val: string) => void;
    status: string | null;
    onStatusChange: (val: string | null) => void;
    onFilterChange?: () => void;
    disabled?: boolean;
}

export function TextStatusFilter({
    text,
    onTextChange,
    status,
    onStatusChange,
    onFilterChange,
    disabled = false,
}: TextStatusFilterProps) {
    const { t } = useTranslation();
    return (
        <Group grow align="flex-start" gap="sm">
            <TextInput
                label={t('text')}
                placeholder={t('search')}
                value={text}
                onChange={(e) => {
                    onTextChange(e.currentTarget.value);
                    onFilterChange?.();
                }}
                disabled={disabled}
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
                disabled={disabled}
                clearable
            />
        </Group>
    );
}
