import { ActionIcon, Menu, Tooltip } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

export interface StatusOption<T = number | string> {
    value: T;
    label: string;
}

export interface StatusActionMenuProps<T = number | string> {
    value?: T;
    currentStatus?: T;
    status?: T;
    options?: StatusOption<T>[];
    onChange?: (status: T) => void;
    onStatusChange?: (status: T) => void;
    loading?: boolean;
    isPending?: boolean;
    disabled?: boolean;
    tooltipLabel?: string;
    width?: number;
}

export function StatusActionMenu<T = number | string>({
    value,
    currentStatus,
    status,
    options,
    onChange,
    onStatusChange,
    loading = false,
    isPending = false,
    disabled = false,
    tooltipLabel,
    width = 150,
}: StatusActionMenuProps<T>) {
    const { t } = useTranslation();
    const actualValue = value ?? currentStatus ?? status;
    const actualOnChange = onChange ?? onStatusChange ?? (() => {});
    const actualLoading = loading || isPending;
    const actualOptions = options ?? (ElementStatusEnum.getOptions(t) as unknown as StatusOption<T>[]);
    const label = tooltipLabel ?? t('changeStatus');

    return (
        <Menu shadow="md" width={width} position="bottom-end">
            <Menu.Target>
                <Tooltip label={label} withArrow>
                    <ActionIcon
                        variant="light"
                        size={30}
                        aria-label={label}
                        loading={actualLoading}
                        disabled={disabled || actualLoading}
                    >
                        <IconAdjustments size={16} />
                    </ActionIcon>
                </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
                {actualOptions.map((opt) => (
                    <Menu.Item
                        key={String(opt.value)}
                        onClick={() => actualOnChange(opt.value)}
                        disabled={actualValue === opt.value || actualLoading}
                    >
                        {opt.label}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
}
