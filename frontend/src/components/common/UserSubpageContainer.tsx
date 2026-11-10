import React from 'react';
import { Center, Loader, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { userService, type UserResource } from '../../api/services';
import NotFound from '../NotFound';
import { UserProfileNav } from '../UserProfileNav';
import { useUserSubpageAccess } from '../../hooks';
import { RoleEnum } from '../../enums/RoleEnum';

export interface UserSubpageContextValue {
    targetUser: UserResource;
    isOwner: boolean;
    isAdmin: boolean;
    canAccessSubpage: boolean;
    hasRequiredRole: boolean;
}

export interface UserSubpageContainerProps {
    ownerOrAdminOnly?: boolean;
    requiredRole?: RoleEnum;
    children: (ctx: UserSubpageContextValue) => React.ReactNode;
}

interface UserSubpageContentWrapperProps {
    render: (ctx: UserSubpageContextValue) => React.ReactNode;
    value: UserSubpageContextValue;
}

function UserSubpageContentWrapper({ render, value }: UserSubpageContentWrapperProps) {
    return <>{render(value)}</>;
}

export function UserSubpageContainer({ ownerOrAdminOnly = false, requiredRole, children }: UserSubpageContainerProps) {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await userService.getUsers({
                params: {
                    query: {
                        filter: { link, userIds: null },
                        'include[]': ['userDisciplines', 'userRoles'],
                        limit: 1,
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
        enabled: !!link,
    });

    const {
        isOwner,
        isAdmin,
        canAccessSubpage,
        hasRequiredRole,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
        requiredRole,
        ownerOrAdminOnly,
    });

    if (userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('notFound')} />;
    }

    if (!canAccessSubpage || (requiredRole && !hasRequiredRole)) {
        return <NotFound title={t('accessDenied')} />;
    }

    const contextValue = {
        targetUser,
        isOwner,
        isAdmin,
        canAccessSubpage,
        hasRequiredRole,
    };

    return (
        <Stack key={targetUser.id}>
            <UserProfileNav user={targetUser} isOwner={isOwner} />
            <UserSubpageContentWrapper render={children} value={contextValue} />
        </Stack>
    );
}
