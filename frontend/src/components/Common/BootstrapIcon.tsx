import {type FC} from 'react';

interface BootstrapIconProps {
    name: string;
    className?: string;
}

const BootstrapIcon: FC<BootstrapIconProps> = ({name, className = ''}) => (
    <span className={`bi bi-${name}${className ? ` ${className}` : ''}`} aria-hidden="true" />
);

export default BootstrapIcon;