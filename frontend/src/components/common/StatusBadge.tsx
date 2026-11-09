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

const ENUM_MAP: Record<string, EnumLike> = {
    element: ElementStatusEnum,
    friend: FriendStatusEnum,
    user: UserStatusEnum,
    role: RoleEnum,
    discipline: DisciplineEnum,
};

export interface StatusBadgeProps {
    status?: number | string | null;
    label?: string;
    color?: MantineColor;
    variant?: BadgeVariant;
    enumType?: EnumLike;
    type?: 'element' | 'friend' | 'role' | 'discipline' | 'user' | string;
}

export function StatusBadge({ status, label, color: explicitColor, variant, enumType, type }: StatusBadgeProps) {
    const { t } = useTranslation();
    const resolvedEnumType = enumType ?? (type ? ENUM_MAP[type] : undefined) ?? ElementStatusEnum;

    let resolvedLabel = label;
    if (!resolvedLabel && status !== undefined && status !== null) {
        resolvedLabel = resolvedEnumType.getOptions(t).find((o) => o.value === status)?.label ?? String(status);
    }

    let color: MantineColor = explicitColor ?? 'gray';
    if (!explicitColor && status !== undefined && status !== null) {
        const num = Number(status);
        if (type === 'role') {
            color = num === RoleEnum.ADMINISTRATOR ? 'red' : num === RoleEnum.ORGANIZER ? 'blue' : 'gray';
        } else if (type === 'discipline') {
            color = 'blue';
        } else if (num === 2) {
            color = 'green';
        } else if (num === 3 || num === 4) {
            color = 'red';
        } else if (num === 1) {
            color = resolvedEnumType === ElementStatusEnum ? 'gray' : 'yellow';
        }
    }

    return (
        <Badge color={color} variant={variant}>
            {resolvedLabel ?? ''}
        </Badge>
    );
}
