import { ActionIcon, Tooltip } from '@mantine/core';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface ViewActionButtonProps {
    to?: string;
    onClick?: () => void;
    tooltipLabel?: string;
    disabled?: boolean;
}

export function ViewActionButton({ to, onClick, tooltipLabel, disabled }: ViewActionButtonProps) {
    const { t } = useTranslation();
    const label = tooltipLabel ?? t('details');

    if (to) {
        return (
            <Tooltip label={label}>
                <ActionIcon component={Link} to={to} aria-label={label} disabled={disabled}>
                    <IconEye size={16} />
                </ActionIcon>
            </Tooltip>
        );
    }

    return (
        <Tooltip label={label}>
            <ActionIcon onClick={onClick} aria-label={label} disabled={disabled}>
                <IconEye size={16} />
            </ActionIcon>
        </Tooltip>
    );
}

interface EditActionButtonProps {
    onClick: () => void;
    tooltipLabel?: string;
    tooltip?: string;
    disabled?: boolean;
    loading?: boolean;
}

export function EditActionButton({ onClick, tooltipLabel, tooltip, disabled, loading }: EditActionButtonProps) {
    const { t } = useTranslation();
    const label = tooltipLabel ?? tooltip ?? t('edit');

    return (
        <Tooltip label={label}>
            <ActionIcon onClick={onClick} aria-label={label} disabled={disabled} loading={loading}>
                <IconEdit size={16} />
            </ActionIcon>
        </Tooltip>
    );
}

interface DeleteActionButtonProps {
    onClick: () => void;
    tooltipLabel?: string;
    tooltip?: string;
    loading?: boolean;
    isPending?: boolean;
    disabled?: boolean;
}

export function DeleteActionButton({
    onClick,
    tooltipLabel,
    tooltip,
    loading,
    isPending,
    disabled,
}: DeleteActionButtonProps) {
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
