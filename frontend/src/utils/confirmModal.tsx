import { Button, Group, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useOffline } from '../services';

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
    const id = `confirm-modal-${Math.random().toString(36).slice(2, 9)}`;
    const confirmationButton = (
        <ConfirmationButton
            confirmColor={confirmColor}
            confirmLabel={confirmLabel}
            id={id}
            isOfflineAllowed={isOfflineAllowed}
            onConfirm={onConfirm}
        />
    );

    modals.open({
        modalId: id,
        title,
        onClose: onCancel,
        children: (
            <>
                {message && (
                    <Text size="sm" mb="md">
                        {message}
                    </Text>
                )}
                <Group justify="flex-end" mt={message ? 0 : 'md'}>
                    {confirmationButton}
                    {withCancelButton && (
                        <Button
                            variant="default"
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

interface ConfirmationButtonProps {
    id: string;
    confirmColor: string;
    confirmLabel: string;
    isOfflineAllowed?: boolean;
    onConfirm: () => void;
}

function ConfirmationButton({ id, confirmColor, confirmLabel, isOfflineAllowed, onConfirm }: ConfirmationButtonProps) {
    const { interactionPolicy } = useOffline();
    const isDisabled = interactionPolicy.isDisabled('confirmation', isOfflineAllowed);

    return (
        <Button
            color={confirmColor}
            disabled={isDisabled}
            onClick={() => {
                onConfirm();
                modals.close(id);
            }}
        >
            {confirmLabel}
        </Button>
    );
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
