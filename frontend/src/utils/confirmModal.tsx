import { Button, Group, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { isTrainingsOrGoalsRoute } from '../services';

export interface ConfirmModalOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    isOfflineAllowed?: boolean;
    withCancelButton?: boolean;
}

export function openConfirmActionModal({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmColor = 'red',
    onConfirm,
    onCancel,
    isOfflineAllowed,
    withCancelButton = false,
}: ConfirmModalOptions) {
    const isAllowed =
        isOfflineAllowed ?? (typeof window !== 'undefined' && isTrainingsOrGoalsRoute(window.location.pathname));

    const id = `confirm-modal-${Math.random().toString(36).slice(2, 9)}`;

    modals.open({
        modalId: id,
        title,
        onClose: onCancel,
        className: isAllowed ? 'training-goal-modal' : undefined,
        'data-training-modal': isAllowed ? 'true' : undefined,
        children: (
            <>
                {message && (
                    <Text size="sm" mb="md">
                        {message}
                    </Text>
                )}
                <Group justify="flex-end" mt={message ? 0 : 'md'}>
                    <Button
                        color={confirmColor}
                        data-offline-allowed={isAllowed ? 'true' : undefined}
                        onClick={() => {
                            onConfirm();
                            modals.close(id);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                    {withCancelButton && (
                        <Button
                            variant="default"
                            data-offline-allowed="true"
                            onClick={() => {
                                onCancel?.();
                                modals.close(id);
                            }}
                        >
                            {cancelLabel}
                        </Button>
                    )}
                </Group>
            </>
        ),
    });
}

export function confirmDelete(
    t: (key: string) => string,
    onConfirm: () => void,
    options?: {
        title?: string;
        message?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        isOfflineAllowed?: boolean;
        withCancelButton?: boolean;
    },
) {
    openConfirmActionModal({
        title: options?.title ?? t('confirmDeleteTitle'),
        message: options?.message ?? t('confirmDeleteMessage'),
        confirmLabel: options?.confirmLabel ?? t('delete'),
        cancelLabel: options?.cancelLabel ?? t('cancel'),
        confirmColor: 'red',
        onConfirm,
        isOfflineAllowed: options?.isOfflineAllowed,
        withCancelButton: options?.withCancelButton ?? false,
    });
}
