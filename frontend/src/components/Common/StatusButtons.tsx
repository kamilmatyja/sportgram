import { type FC } from 'react';
import { Button, Stack } from 'react-bootstrap';

import { EnumBadge } from './EnumBadge';
import { useTranslation } from '../../context/TranslationContext';

interface StatusOption {
    value: number;
    label: string;
}

interface StatusButtonsProps {
    options: StatusOption[];
    current: number;
    canSelect?: (value: number) => boolean;
    onSelect: (value: number) => void;
    disabled?: boolean;
}

export const StatusButtons: FC<StatusButtonsProps> = ({ options, current, canSelect, onSelect, disabled }) => (
    <Stack direction="horizontal" gap={1} className="flex-wrap justify-content-end">
        {options
            .filter((option) => option.value !== current && (!canSelect || canSelect(option.value)))
            .map((option) => (
                <Button
                    key={option.value}
                    variant="profile-outline-primary"
                    className="btn-xs py-0 px-2"
                    onClick={() => onSelect(option.value)}
                    disabled={disabled}
                >
                    {option.label}
                </Button>
            ))}
    </Stack>
);

export const StatusSection: FC<StatusButtonsProps> = ({ options, current, ...props }) => {
    const { t } = useTranslation();

    return (
        <Stack direction="horizontal" gap={3} className="align-items-center p-2 bg-light rounded">
            <Stack as="strong" className="small flex-grow-0">
                {t('status')}:
            </Stack>
            <EnumBadge options={options} value={current} />
            <Stack className="ms-auto">
                <StatusButtons options={options} current={current} {...props} />
            </Stack>
        </Stack>
    );
};
