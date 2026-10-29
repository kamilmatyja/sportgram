import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';

export interface ConfirmModalOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
    onConfirm: () => void;
}

export function openConfirmActionModal({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmColor = 'red',
    onConfirm,
}: ConfirmModalOptions) {
    modals.openConfirmModal({
        title,
        children: message ? <Text size="sm">{message}</Text> : undefined,
        labels: {
            confirm: confirmLabel,
            cancel: cancelLabel,
        },
        confirmProps: { color: confirmColor },
        onConfirm,
    });
}
