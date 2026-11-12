import { useEffect, useRef } from 'react';
import { Group, Text, Tooltip } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entryService } from '../api/services';
import type { EntryTypeEnum } from '../enums/EntryTypeEnum';
import { useAuth } from '../auth';

export const sessionTrackedEntities = new Set<string>();

export interface EntityViewCounterProps {
    entityId?: string | null;
    type: EntryTypeEnum;
    size?: number;
    textSize?: 'xs' | 'sm' | 'md';
    track?: boolean;
    c?: string;
    showTooltip?: boolean;
    opacity?: number;
    className?: string;
}

export function EntityViewCounter({
    entityId,
    type,
    size = 16,
    textSize = 'sm',
    track = true,
    c = 'dimmed',
    showTooltip = true,
    opacity,
    className,
}: EntityViewCounterProps) {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const lastTrackedIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!track || !entityId || !currentUser) return;
        const trackingKey = `${type}:${entityId}`;
        if (sessionTrackedEntities.has(trackingKey) || lastTrackedIdRef.current === entityId) return;

        lastTrackedIdRef.current = entityId;
        sessionTrackedEntities.add(trackingKey);

        entryService
            .createEntry({ body: { entityId, type } })
            .then(() => {
                queryClient.setQueryData(['entry-views', type, entityId], (old: number | undefined) => (old ?? 0) + 1);
                void queryClient.invalidateQueries({ queryKey: ['entry-views', type, entityId] });
            })
            .catch(() => {
                sessionTrackedEntities.delete(trackingKey);
                if (lastTrackedIdRef.current === entityId) {
                    lastTrackedIdRef.current = null;
                }
            });
    }, [track, entityId, type, currentUser, queryClient]);

    const { data: viewsCount = 0 } = useQuery({
        queryKey: ['entry-views', type, entityId],
        queryFn: async () => {
            if (!entityId || !currentUser) return 0;
            const res = await entryService.getEntries({
                params: {
                    query: {
                        filter: { entityIds: [entityId], type },
                        limit: 1,
                    },
                },
            });
            return res.pagination?.total ?? 0;
        },
        enabled: !!entityId && !!currentUser,
        staleTime: 30000,
    });

    if (!entityId) return null;

    const content = (
        <Group gap="xs" align="center" wrap="nowrap" c={c} opacity={opacity} className={className}>
            <IconEye size={size} />
            <Text size={textSize} c={c} span>
                {viewsCount}
            </Text>
        </Group>
    );

    if (!showTooltip) return content;

    return <Tooltip label={t('views')}>{content}</Tooltip>;
}
