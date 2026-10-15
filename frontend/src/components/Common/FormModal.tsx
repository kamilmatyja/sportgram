import { type FC, type ReactNode } from 'react';
import { Button, Modal, Stack } from 'react-bootstrap';

import { FormErrorAlert } from './FormFields';
import { useTranslation } from '../../context/TranslationContext';

interface FormModalProps {
    show: boolean;
    title: ReactNode;
    themeClass?: string;
    closeModal: () => void;
    loading: boolean;
    globalError?: string | null;
    formId?: string;
    submitLabel?: string;
    submitDisabled?: boolean;
    footerActions?: ReactNode;
    children: ReactNode;
}

export const FormModal: FC<FormModalProps> = ({
    show,
    title,
    themeClass,
    closeModal,
    loading,
    globalError,
    formId,
    submitLabel,
    submitDisabled,
    footerActions,
    children,
}) => {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={closeModal} size="lg" className={themeClass} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FormErrorAlert error={globalError} />
                {children}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={loading}>
                    {t('cancel')}
                </Button>
                {(footerActions || (formId && submitLabel)) && (
                    <Stack direction="horizontal" gap={2}>
                        {footerActions}
                        {formId && submitLabel && (
                            <Button
                                variant="profile-primary"
                                type="submit"
                                form={formId}
                                disabled={loading || submitDisabled}
                            >
                                {loading ? t('sending') : submitLabel}
                            </Button>
                        )}
                    </Stack>
                )}
            </Modal.Footer>
        </Modal>
    );
};
