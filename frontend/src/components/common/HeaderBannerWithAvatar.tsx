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
    const [imageError, setImageError] = React.useState(false);

    return (
        <Card p={0} mb="sm">
            <Card.Section>
                {backgroundPhotoSrc && !imageError ? (
                    <Box h={160} pos="relative" bg="var(--mantine-primary-color-filled)">
                        <Center pos="absolute" inset={0}>
                            <Text fz={48} fw={700} c="white" opacity={0.8}>
                                ?
                            </Text>
                        </Center>
                        <Image
                            src={backgroundPhotoSrc}
                            h={160}
                            w="100%"
                            alt={altText}
                            pos="relative"
                            radius={0}
                            onError={() => setImageError(true)}
                        />
                    </Box>
                ) : (
                    <Center h={160} bg="var(--mantine-primary-color-filled)">
                        <Text fz={48} fw={700} c="white" opacity={0.8}>
                            ?
                        </Text>
                    </Center>
                )}
            </Card.Section>

            <Box p="md" pos="relative">
                <Avatar src={profilePhotoSrc} size={100} className="profile-avatar-border">
                    ?
                </Avatar>
                {children}
            </Box>
        </Card>
    );
}
