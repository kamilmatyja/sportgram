import React from 'react';
import { Stack, Text, PinInput, Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export interface AuthVerificationStepProps {
    promptText?: string;
    code: string;
    onCodeChange: (code: string) => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    onBack: () => void;
    onResend: () => void;
    loading: boolean;
    error?: string;
    submitLabel?: string;
    isSubmitDisabled?: boolean;
    children?: React.ReactNode;
}

export function AuthVerificationStep({
    promptText,
    code,
    onCodeChange,
    onSubmit,
    onBack,
    onResend,
    loading,
    error,
    submitLabel,
    isSubmitDisabled = false,
    children,
}: AuthVerificationStepProps) {
    const { t } = useTranslation();

    return (
        <form onSubmit={onSubmit}>
            <Stack align="center">
                <Text size="sm" c="dimmed" ta="center">
                    {promptText ?? t('enterVerificationCodePrompt')}
                </Text>

                <PinInput
                    length={6}
                    type="number"
                    value={code}
                    onChange={onCodeChange}
                    error={!!error}
                    size="md"
                    autoFocus
                />

                {error && (
                    <Text size="xs" c="red" ta="center">
                        {error}
                    </Text>
                )}

                {children}

                <Button
                    type="submit"
                    fullWidth
                    mt="md"
                    loading={loading}
                    disabled={loading || code.length < 6 || isSubmitDisabled}
                >
                    {submitLabel ?? t('verify')}
                </Button>

                <Group justify="space-between" w="100%" mt="xs">
                    <Button variant="default" size="xs" onClick={onBack} disabled={loading}>
                        {t('back')}
                    </Button>
                    <Button variant="default" size="xs" onClick={onResend} loading={loading} disabled={loading}>
                        {t('resend')}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
