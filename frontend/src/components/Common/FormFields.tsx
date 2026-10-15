import { type ChangeEvent, type ComponentPropsWithoutRef, type FC, type ReactNode, useId } from 'react';
import { Alert, Form } from 'react-bootstrap';

import SelectOptions, { type SelectOption } from './SelectOptions';
import { useTranslation } from '../../context/TranslationContext';

type FieldError = string | string[] | null | undefined;

export type FieldErrors = Record<string, string | string[]>;

export interface FormModalStateProps<TBody> {
    show: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: FieldErrors;
    formData: TBody;
    handleChange: (e: ChangeEvent<any>) => void;
}

const useErrorMessage = (error: FieldError): string => {
    const { t } = useTranslation();
    const messages = Array.isArray(error) ? error : error ? [error] : [];

    return messages.map((message) => t(message)).join(' ');
};

const normalizeValue = <T,>(value: T): T | '' => (value === null || Number.isNaN(value) ? '' : value);

interface FieldProps {
    label?: ReactNode;
    error?: FieldError;
    groupClassName?: string;
}

const Field: FC<FieldProps & { message: string; children: ReactNode }> = ({
    label,
    message,
    groupClassName,
    children,
}) => {
    const controlId = useId();

    return (
        <Form.Group controlId={controlId} className={groupClassName}>
            {label && <Form.Label>{label}</Form.Label>}
            {children}
            <Form.Control.Feedback type="invalid">{message}</Form.Control.Feedback>
        </Form.Group>
    );
};

type InputFieldProps = FieldProps &
    Omit<ComponentPropsWithoutRef<typeof Form.Control>, 'onChange'> & {
        onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
        rows?: number;
        accept?: string;
    };

export const InputField: FC<InputFieldProps> = ({ label, error, groupClassName, onChange, ...props }) => {
    const message = useErrorMessage(error);

    return (
        <Field label={label} message={message} groupClassName={groupClassName}>
            <Form.Control
                {...props}
                {...('value' in props && { value: normalizeValue(props.value) })}
                onChange={onChange as ComponentPropsWithoutRef<typeof Form.Control>['onChange']}
                isInvalid={!!message}
            />
        </Field>
    );
};

type SelectFieldProps = FieldProps &
    Omit<ComponentPropsWithoutRef<typeof Form.Select>, 'onChange'> & {
        onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
        options?: SelectOption[];
        placeholder?: string;
        multiple?: boolean;
    };

export const SelectField: FC<SelectFieldProps> = ({
    label,
    error,
    groupClassName,
    options,
    placeholder,
    children,
    ...props
}) => {
    const message = useErrorMessage(error);

    return (
        <Field label={label} message={message} groupClassName={groupClassName}>
            <Form.Select
                {...props}
                {...('value' in props && { value: normalizeValue(props.value) })}
                isInvalid={!!message}
            >
                {options ? <SelectOptions options={options} placeholder={placeholder} /> : children}
            </Form.Select>
        </Field>
    );
};

type CheckFieldProps = Omit<FieldProps, 'label'> & ComponentPropsWithoutRef<typeof Form.Check>;

export const CheckField: FC<CheckFieldProps> = ({ error, groupClassName, ...props }) => {
    const message = useErrorMessage(error);
    const controlId = useId();

    return (
        <Form.Group controlId={controlId} className={groupClassName}>
            <Form.Check {...props} isInvalid={!!message} feedback={message} feedbackType="invalid" />
        </Form.Group>
    );
};

interface FormErrorAlertProps {
    error?: string | null;
    className?: string;
}

export const FormErrorAlert: FC<FormErrorAlertProps> = ({ error, className }) => {
    const { t } = useTranslation();
    if (!error) return null;

    return (
        <Alert variant="danger" className={className}>
            {t(error)}
        </Alert>
    );
};
