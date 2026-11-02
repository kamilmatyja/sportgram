import { Badge, type MantineColor } from '@mantine/core';

interface StatusBadgeProps {
    status: number | string;
    label?: string;
    color?: MantineColor;
}

export function StatusBadge({ status, label, color: explicitColor }: StatusBadgeProps) {
    let color: MantineColor = explicitColor ?? 'gray';

    if (!explicitColor) {
        const statusNum = typeof status === 'number' ? status : parseInt(status, 10);
        if (statusNum === 2) {
            color = 'green';
        } else if (statusNum === 3 || statusNum === 4) {
            color = 'red';
        } else {
            color = 'gray';
        }
    }

    return (
        <Badge color={color} variant="light">
            {label ?? status}
        </Badge>
    );
}
