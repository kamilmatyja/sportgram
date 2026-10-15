import { type FC } from 'react';
import { Badge } from 'react-bootstrap';

import { type SelectOption } from './SelectOptions';
import { getOptionLabel } from '../../utils/options';

interface EnumBadgeProps {
    options: SelectOption[];
    value: string | number | null | undefined;
    className?: string;
}

export const EnumBadge: FC<EnumBadgeProps> = ({ options, value, className = '' }) => (
    <Badge bg="light" text="dark" className={`border profile-theme-border ${className}`.trim()}>
        {getOptionLabel(options, value)}
    </Badge>
);
