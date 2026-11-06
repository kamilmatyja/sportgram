import { Badge, type MantineColor, type BadgeVariant } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export interface EnumLike {
    getOptions: (t: (key: string) => string) => { value: number | string; label: string }[];
}

export interface StatusBadgeProps {
    status?: number | string | null;
    label?: string;
    color?: MantineColor;
    variant?: BadgeVariant;
    enumType?: EnumLike;
    type?: 'element' | 'friend' | 'role' | 'discipline' | 'user' | string;
}

export function StatusBadge({
    status,
    label,
    color: explicitColor,
    variant = 'light',
    enumType,
    type,
}: StatusBadgeProps) {
    const { t } = useTranslation();

    let resolvedEnumType = enumType;
    if (!resolvedEnumType && type) {
        switch (type) {
            case 'element':
                resolvedEnumType = ElementStatusEnum;
                break;
            case 'friend':
                resolvedEnumType = FriendStatusEnum;
                break;
            case 'user':
                resolvedEnumType = UserStatusEnum;
                break;
            case 'role':
                resolvedEnumType = RoleEnum;
                break;
            case 'discipline':
                resolvedEnumType = DisciplineEnum;
                break;
        }
    }

    let resolvedLabel = label;
    if (!resolvedLabel && resolvedEnumType && status !== undefined && status !== null) {
        const option = resolvedEnumType.getOptions(t).find((o) => o.value === status);
        if (option) {
            resolvedLabel = option.label;
        }
    }

    if (!resolvedLabel) {
        resolvedLabel = status !== undefined && status !== null ? String(status) : '';
    }

    let color: MantineColor = explicitColor ?? 'gray';
    if (!explicitColor && status !== undefined && status !== null) {
        const statusNum = typeof status === 'number' ? status : parseInt(String(status), 10);
        if (type === 'role') {
            color = statusNum === RoleEnum.ADMINISTRATOR ? 'red' : statusNum === RoleEnum.ORGANIZER ? 'blue' : 'gray';
        } else if (type === 'discipline') {
            color = 'blue';
        } else if (statusNum === 2) {
            color = 'green';
        } else if (statusNum === 3 || statusNum === 4) {
            color = 'red';
        } else if (statusNum === 1) {
            color = resolvedEnumType === ElementStatusEnum ? 'gray' : 'yellow';
        } else {
            color = 'gray';
        }
    }

    return (
        <Badge color={color} variant={variant}>
            {resolvedLabel}
        </Badge>
    );
}
