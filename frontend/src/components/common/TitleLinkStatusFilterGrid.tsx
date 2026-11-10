import { SimpleGrid, TextInput, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { useOffline } from '../../services';

export interface TitleLinkStatusFilterGridProps {
    title: string;
    onTitleChange: (val: string) => void;
    link: string;
    onLinkChange: (val: string) => void;
    status: string | null;
    onStatusChange: (val: string | null) => void;
    onFilterChange?: () => void;
    disabled?: boolean;
}

export function TitleLinkStatusFilterGrid({
    title,
    onTitleChange,
    link,
    onLinkChange,
    status,
    onStatusChange,
    onFilterChange,
    disabled = false,
}: TitleLinkStatusFilterGridProps) {
    const { t } = useTranslation();
    const { isOfflineDisabled } = useOffline();
    const isEffectiveDisabled = disabled || isOfflineDisabled;

    return (
        <SimpleGrid className="filter-grid-3">
            <TextInput
                label={t('title')}
                value={title}
                onChange={(e) => {
                    onTitleChange(e.currentTarget.value);
                    onFilterChange?.();
                }}
                disabled={isEffectiveDisabled}
            />
            <TextInput
                label={t('link')}
                value={link}
                onChange={(e) => {
                    onLinkChange(e.currentTarget.value);
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
