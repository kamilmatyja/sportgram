import { Center, Stack, Text, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface NotFoundProps {
    title?: string;
    message?: string;
}

export function NotFound({ title, message }: NotFoundProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Center py={60}>
            <Stack align="center" gap="sm">
                <Text size="48px" fw={800} c="blue.5">
                    404
                </Text>
                <Text size="xl" fw={600} ta="center">
                    {title ?? t('notFound.title')}
                </Text>
                <Text c="dimmed" ta="center">
                    {message ?? t('notFound.message')}
                </Text>
                <Button variant="light" size="xs" mt="sm" onClick={() => navigate('/')}>
                    {t('navHome')}
                </Button>
            </Stack>
        </Center>
    );
}

export default NotFound;
