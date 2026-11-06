import React from 'react';
import { Card, Box, Avatar, Text, Image, Center } from '@mantine/core';

export interface HeaderBannerWithAvatarProps {
    backgroundPhotoSrc?: string;
    profilePhotoSrc?: string;
    altText?: string;
    children: React.ReactNode;
}

export function HeaderBannerWithAvatar({
    backgroundPhotoSrc,
    profilePhotoSrc,
    altText = '',
    children,
}: HeaderBannerWithAvatarProps) {
    return (
        <Card withBorder radius="md" p={0} mb="sm" shadow="xs" className="overflow-hidden">
            {backgroundPhotoSrc ? (
                <Box h={160} pos="relative" bg="var(--mantine-primary-color-filled)">
                    <Center pos="absolute" inset={0} className="header-bg-placeholder-center">
                        <Text fz={48} fw={700} c="white" className="header-bg-placeholder-text">
                            ?
                        </Text>
                    </Center>
                    <Image
                        className="header-bg-image"
                        src={backgroundPhotoSrc}
                        h={160}
                        w="100%"
                        fit="cover"
                        alt={altText}
                        pos="relative"
                        onError={(e) => {
                            e.currentTarget.classList.add('d-none');
                        }}
                    />
                </Box>
            ) : (
                <Center h={160} bg="var(--mantine-primary-color-filled)">
                    <Text fz={48} fw={700} c="white" className="header-bg-placeholder-text">
                        ?
                    </Text>
                </Center>
            )}

            <Box p="md" pos="relative" className="header-content-box">
                <Avatar
                    src={profilePhotoSrc}
                    size={100}
                    radius={5}
                    pos="absolute"
                    top={-50}
                    left={24}
                    className="profile-avatar-border"
                >
                    ?
                </Avatar>
                {children}
            </Box>
        </Card>
    );
}
