import { type FC } from 'react';

interface BootstrapIconProps {
    name: string;
    className?: string;
}

const BootstrapIcon: FC<BootstrapIconProps> = ({ name, className = '' }) => (
    <i className={`bi bi-${name} ${className}`} aria-hidden="true" />
);

export default BootstrapIcon;
