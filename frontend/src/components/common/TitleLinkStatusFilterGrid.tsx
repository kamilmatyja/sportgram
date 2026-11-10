import { SimpleGrid, TextInput, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

export interface TitleLinkStatusFilterGridProps {
    title: string;
    onTitleChange: (val: string) => void;
    link: string;
    onLinkChange: (val: string) => void;
    status: string | null;
    onStatusChange: (val: string | null) => void;
    onFilterChange?: () => void;
}

export function TitleLinkStatusFilterGrid({
    title,
    onTitleChange,
    link,
    onLinkChange,
    status,
    onStatusChange,
    onFilterChange,
}: TitleLinkStatusFilterGridProps) {
    const { t } = useTranslation();

    return (
        <SimpleGrid className="filter-grid-3">
            <TextInput
                label={t('title')}
                value={title}
                onChange={(e) => {
                    onTitleChange(e.currentTarget.value);
                    onFilterChange?.();
                }}
            />
            <TextInput
                label={t('link')}
                value={link}
                onChange={(e) => {
                    onLinkChange(e.currentTarget.value);
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
