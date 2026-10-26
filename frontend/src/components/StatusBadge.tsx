import { Badge, type MantineColor } from '@mantine/core';

interface StatusBadgeProps {
    status: number | string;
    label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
    let color: MantineColor = 'gray';

    // Common status codes across sportgram enums:
    // 1 = draft / pending / active
    // 2 = active / accepted
    // 3 = completed / banned / rejected
    const statusNum = typeof status === 'number' ? status : parseInt(status, 10);

    if (statusNum === 2) {
        color = 'green';
    } else if (statusNum === 1) {
        color = 'yellow';
    } else if (statusNum === 3) {
        color = 'red';
    } else if (statusNum === 4) {
        color = 'gray';
    }

    return (
        <Badge color={color} variant="light" size="sm">
            {label ?? status}
        </Badge>
    );
}
