import { type FC } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import BootstrapIcon from './BootstrapIcon';

interface IconButtonProps {
    icon: string;
    to?: string;
    onClick?: () => void;
    variant?: string;
}

export const IconButton: FC<IconButtonProps> = ({ icon, to, onClick, variant = 'profile-outline-primary' }) =>
    to ? (
        <Link to={to} className={`btn btn-sm btn-${variant} rounded-circle shadow-sm`}>
            <BootstrapIcon name={icon} />
        </Link>
    ) : (
        <Button variant={variant} size="sm" className="rounded-circle shadow-sm" onClick={onClick}>
            <BootstrapIcon name={icon} />
        </Button>
    );
