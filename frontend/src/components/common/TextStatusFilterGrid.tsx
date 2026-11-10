import { SimpleGrid, TextInput, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { useOffline } from '../../services';

export interface TextStatusFilterGridProps {
    text: string;
    onTextChange: (val: string) => void;
    status: string | null;
    onStatusChange: (val: string | null) => void;
    onFilterChange?: () => void;
    disabled?: boolean;
}

export function TextStatusFilterGrid({
    text,
    onTextChange,
    status,
    onStatusChange,
    onFilterChange,
    disabled = false,
}: TextStatusFilterGridProps) {
    const { t } = useTranslation();
    const { isOfflineDisabled } = useOffline();
    const isEffectiveDisabled = disabled || isOfflineDisabled;

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
                disabled={isEffectiveDisabled}
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
                disabled={isEffectiveDisabled}
                clearable
            />
        </SimpleGrid>
    );
}
