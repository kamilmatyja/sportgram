import React from 'react';
import { Paper, Stack, Title, Text } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({
    icon = <IconInbox size={48} stroke={1.5} />,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <Paper withBorder radius="md" p="xl" ta="center">
            <Stack align="center" gap="xs">
                <Text c="dimmed">{icon}</Text>
                <Title order={4}>{title}</Title>
                {description && (
                    <Text size="sm" c="dimmed" maw={400}>
                        {description}
                    </Text>
                )}
                {action}
            </Stack>
        </Paper>
    );
}

export default EmptyState;
