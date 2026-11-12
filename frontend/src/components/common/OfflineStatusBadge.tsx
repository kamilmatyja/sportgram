import { Badge, type BadgeProps } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../../services';

export function OfflineStatusBadge(props: BadgeProps) {
    const { t } = useTranslation();
    const { isOffline } = useOffline();

    if (!isOffline) return null;

    return (
        <Badge color="yellow" variant="filled" size="sm" leftSection={<IconAlertTriangle size={14} />} {...props}>
            {t('offlineMode')}
        </Badge>
    );
}
