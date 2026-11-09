import { ActionIcon, Tooltip } from '@mantine/core';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export interface ActionButtonProps {
    to?: string;
    onClick?: () => void;
    tooltipLabel?: string;
    tooltip?: string;
    disabled?: boolean;
    loading?: boolean;
    isPending?: boolean;
}

export function ViewActionButton({ to, onClick, tooltipLabel, tooltip, disabled }: ActionButtonProps) {
    const { t } = useTranslation();
    const label = tooltipLabel ?? tooltip ?? t('details');

    return (
        <Tooltip label={label}>
            {to ? (
                <ActionIcon component={Link} to={to} aria-label={label} disabled={disabled}>
                    <IconEye size={16} />
                </ActionIcon>
            ) : (
                <ActionIcon onClick={onClick} aria-label={label} disabled={disabled}>
                    <IconEye size={16} />
                </ActionIcon>
            )}
        </Tooltip>
    );
}

export function EditActionButton({ onClick, tooltipLabel, tooltip, disabled, loading, isPending }: ActionButtonProps) {
    const { t } = useTranslation();
    const label = tooltipLabel ?? tooltip ?? t('edit');
    const isLoading = loading ?? isPending;

    return (
        <Tooltip label={label}>
            <ActionIcon onClick={onClick} aria-label={label} disabled={disabled || isLoading} loading={isLoading}>
                <IconEdit size={16} />
            </ActionIcon>
        </Tooltip>
    );
}

export function DeleteActionButton({
    onClick,
    tooltipLabel,
    tooltip,
    loading,
    isPending,
    disabled,
}: ActionButtonProps) {
    const { t } = useTranslation();
    const label = tooltipLabel ?? tooltip ?? t('delete');
    const isLoading = loading ?? isPending;

    return (
        <Tooltip label={label}>
            <ActionIcon
                color="red"
                onClick={onClick}
                aria-label={label}
                loading={isLoading}
                disabled={disabled || isLoading}
            >
                <IconTrash size={16} />
            </ActionIcon>
        </Tooltip>
    );
}
