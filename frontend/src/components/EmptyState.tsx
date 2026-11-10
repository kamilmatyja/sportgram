import React from 'react';
import { Paper, Stack, Title, Text, Box } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    withPaper?: boolean;
}

export function EmptyState({
    icon = <IconInbox size={48} stroke={1.5} />,
    title,
    description,
    action,
    withPaper = false,
}: EmptyStateProps) {
    const content = (
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
    );

    if (withPaper) {
        return (
            <Paper p="xl" ta="center">
                {content}
            </Paper>
        );
    }

    return (
        <Box py="xl" ta="center">
            {content}
        </Box>
    );
}
