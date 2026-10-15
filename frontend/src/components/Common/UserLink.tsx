import { type FC } from 'react';
import { Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { type UserResponse } from '../../api/responses/UserResponse';
import { formatUserName } from '../../utils/user';

interface UserLinkProps {
    user: UserResponse | null | undefined;
    className?: string;
}

export const UserLink: FC<UserLinkProps> = ({ user, className = '' }) =>
    user ? (
        <Link to={`/users/${user.link}`} className={`text-decoration-none ${className}`.trim()}>
            {formatUserName(user)}
        </Link>
    ) : (
        <Stack as="span" className="text-muted">
            -
        </Stack>
    );
