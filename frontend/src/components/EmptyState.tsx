import React from 'react';
import { Paper, Stack, Title, Text, Box } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    withPaper?: boolean;
    p?: string | number;
    py?: string | number;
    px?: string | number;
    m?: string | number;
    radius?: string | number;
}

export function EmptyState({
    icon = <IconInbox size={48} stroke={1.5} />,
    title,
    description,
    action,
    withPaper = true,
    p,
    py = 'sm',
    px = 0,
    m = 0,
    radius = 0,
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
            <Paper
                p={p}
                py={p !== undefined ? undefined : py}
                px={p !== undefined ? undefined : px}
                m={m}
                radius={radius}
                ta="center"
                bg="var(--mantine-color-gray-light)"
            >
                {content}
            </Paper>
        );
    }

    return (
        <Box p={p} py={p !== undefined ? undefined : py} px={p !== undefined ? undefined : px} m={m} ta="center">
            {content}
        </Box>
    );
}
