import React from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export interface ActionButtonProps {
    to?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
    tooltipLabel?: string;
    tooltip?: string;
    disabled?: boolean;
    loading?: boolean;
    isPending?: boolean;
    size?: number | string;
    variant?: string;
    color?: string;
    className?: string;
    'aria-label'?: string;
}

export function ActionButton({
    icon,
    onClick,
    tooltipLabel,
    tooltip,
    disabled,
    loading,
    isPending,
    size,
    variant,
    color,
    className,
    'aria-label': ariaLabel,
}: ActionButtonProps & { icon: React.ReactNode }) {
    const label = tooltipLabel ?? tooltip ?? '';
    const isLoading = loading ?? isPending;
    const isEffectiveDisabled = Boolean(disabled || isLoading);

    const content = (
        <ActionIcon
            onClick={onClick}
            aria-label={ariaLabel ?? label}
            disabled={isEffectiveDisabled}
            loading={isLoading}
            size={size}
            variant={variant}
            color={color}
            className={className}
        >
            {icon}
        </ActionIcon>
    );

    if (!label) return content;

    return <Tooltip label={label}>{content}</Tooltip>;
}

export function ViewActionButton({
    to,
    onClick,
    tooltipLabel,
    tooltip,
    disabled,
    size,
    variant,
    color,
    className,
    'aria-label': ariaLabel,
}: ActionButtonProps) {
    const { t } = useTranslation();
    const label = tooltipLabel ?? tooltip ?? t('details');
    const isEffectiveDisabled = Boolean(disabled);
    const iconSize = typeof size === 'number' ? Math.round(size * 0.55) : 16;

    const actionIcon = to ? (
        <ActionIcon
            component={Link}
            to={isEffectiveDisabled ? '#' : to}
            aria-label={ariaLabel ?? label}
            disabled={isEffectiveDisabled}
            size={size}
            variant={variant}
            color={color}
            className={className}
            onClick={(e) => {
                if (isEffectiveDisabled) {
                    e.preventDefault();
                }
            }}
        >
            <IconEye size={iconSize} />
        </ActionIcon>
    ) : (
        <ActionIcon
            onClick={onClick}
            aria-label={ariaLabel ?? label}
            disabled={isEffectiveDisabled}
            size={size}
            variant={variant}
            color={color}
            className={className}
        >
            <IconEye size={iconSize} />
        </ActionIcon>
    );

    return <Tooltip label={label}>{actionIcon}</Tooltip>;
}

export function EditActionButton(props: ActionButtonProps) {
    const { t } = useTranslation();
    const iconSize = typeof props.size === 'number' ? Math.round(props.size * 0.55) : 16;

    return (
        <ActionButton
            tooltip={props.tooltipLabel ?? props.tooltip ?? t('edit')}
            icon={<IconEdit size={iconSize} />}
            {...props}
        />
    );
}

export function DeleteActionButton(props: ActionButtonProps) {
    const { t } = useTranslation();
    const iconSize = typeof props.size === 'number' ? Math.round(props.size * 0.55) : 16;

    return (
        <ActionButton
            color={props.color ?? 'red'}
            tooltip={props.tooltipLabel ?? props.tooltip ?? t('delete')}
            icon={<IconTrash size={iconSize} />}
            {...props}
        />
    );
}
