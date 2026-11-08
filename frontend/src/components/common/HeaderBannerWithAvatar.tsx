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
        <Card p={0} mb="sm" style={{ overflow: 'hidden' }}>
            {backgroundPhotoSrc ? (
                <Box h={160} pos="relative" bg="var(--mantine-primary-color-filled)">
                    <Center pos="absolute" inset={0} style={{ zIndex: 0 }}>
                        <Text fz={48} fw={700} c="white" opacity={0.8} style={{ userSelect: 'none' }}>
                            ?
                        </Text>
                    </Center>
                    <Image
                        src={backgroundPhotoSrc}
                        h={160}
                        w="100%"
                        fit="cover"
                        alt={altText}
                        pos="relative"
                        radius={0}
                        style={{ zIndex: 1 }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </Box>
            ) : (
                <Center h={160} bg="var(--mantine-primary-color-filled)">
                    <Text fz={48} fw={700} c="white" opacity={0.8} style={{ userSelect: 'none' }}>
                        ?
                    </Text>
                </Center>
            )}

            <Box p="md" pos="relative" style={{ zIndex: 2 }}>
                <Avatar
                    src={profilePhotoSrc}
                    size={100}
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
