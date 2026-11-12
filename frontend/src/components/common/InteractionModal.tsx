import { type ReactNode, type SyntheticEvent, useMemo } from 'react';
import { Modal, type ModalProps } from '@mantine/core';
import { useOffline } from '../../services';
import { type InteractionSurface } from '../../services/InteractionPolicy';

interface InteractionModalProps extends ModalProps {
    children?: ReactNode;
    offlineAllowed?: boolean;
}

interface InteractionBoundaryProps {
    children: ReactNode;
    surface: InteractionSurface;
    offlineAllowed?: boolean;
}

export function useInteractionAttributes(surface: InteractionSurface, offlineAllowed?: boolean) {
    const { interactionPolicy } = useOffline();
    const isDisabled = interactionPolicy.isDisabled(surface, offlineAllowed);

    const handleInteraction = (event: SyntheticEvent<HTMLElement>) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const nestedBoundary = target.closest('[data-interaction-boundary]');
        if (
            nestedBoundary &&
            nestedBoundary !== event.currentTarget &&
            nestedBoundary.getAttribute('aria-disabled') !== 'true'
        ) {
            return;
        }

        const allowedControl = target.closest(
            '[data-interaction-allowed], .mantine-Modal-close, .interaction-modal-close',
        );
        if (allowedControl) return;

        if (isDisabled) blockInteraction(event);
    };

    return useMemo(
        () => ({
            'aria-disabled': isDisabled || undefined,
            'data-interaction-boundary': true,
            onPointerDownCapture: isDisabled ? handleInteraction : undefined,
            onClickCapture: isDisabled ? handleInteraction : undefined,
            onKeyDownCapture: isDisabled ? handleInteraction : undefined,
            onSubmitCapture: isDisabled ? handleInteraction : undefined,
            onFocusCapture: isDisabled ? handleInteraction : undefined,
        }),
        [handleInteraction, isDisabled],
    );
}

function blockInteraction(event: SyntheticEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
}

export function InteractionBoundary({ children, surface, offlineAllowed }: InteractionBoundaryProps) {
    const attributes = useInteractionAttributes(surface, offlineAllowed);
    return <div {...attributes}>{children}</div>;
}

export function InteractionModal({ children, offlineAllowed, ...props }: InteractionModalProps) {
    return (
        <Modal
            {...props}
            closeButtonProps={{
                ...props.closeButtonProps,
                'data-interaction-allowed': true,
                className: ['interaction-modal-close', props.closeButtonProps?.className].filter(Boolean).join(' '),
            }}
        >
            <InteractionBoundary surface="modal" offlineAllowed={offlineAllowed}>
                {children}
            </InteractionBoundary>
        </Modal>
    );
}
