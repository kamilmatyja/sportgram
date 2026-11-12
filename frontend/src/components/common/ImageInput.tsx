import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Input, Group, Button, Paper, Stack, Avatar, Box, Text, FileButton, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCamera, IconUpload, IconPhoto, IconRotate, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DeleteActionButton } from './RowActionButtons';

interface CameraCaptureSectionProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

function CameraCaptureSection({ onCapture, onCancel }: CameraCaptureSectionProps) {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const isStartingRef = useRef(false);
    const hasNotifiedRef = useRef(false);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startStream = useCallback(async () => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;
        stopStream();
        setIsLoading(true);
        setIsReady(false);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (!hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                notifications.show({
                    id: 'camera-status-error',
                    color: 'red',
                    title: t('camera'),
                    message: t('cameraPermissionDenied'),
                });
            }
            setIsLoading(false);
            isStartingRef.current = false;
            onCancel();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }
            setIsLoading(false);
            setIsReady(true);
        } catch {
            if (!hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                notifications.show({
                    id: 'camera-status-error',
                    color: 'red',
                    title: t('camera'),
                    message: t('cameraPermissionDenied'),
                });
            }
            setIsLoading(false);
            onCancel();
        } finally {
            isStartingRef.current = false;
        }
    }, [facingMode, onCancel, stopStream, t]);

    useEffect(() => {
        if (!capturedBlob) {
            void startStream();
        }
        return () => {
            stopStream();
        };
    }, [startStream, capturedBlob, stopStream]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleSwitchFacingMode = () => {
        hasNotifiedRef.current = false;
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    setCapturedBlob(blob);
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                    stopStream();
                }
            },
            'image/jpeg',
            0.88,
        );
    };

    const handleRetake = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setCapturedBlob(null);
    };

    const handleAccept = () => {
        if (!capturedBlob) return;
        const filename = `camera-${Date.now()}.jpg`;
        const file = new File([capturedBlob], filename, { type: 'image/jpeg' });
        onCapture(file);
    };

    const handleDiscard = () => {
        stopStream();
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        onCancel();
    };

    return (
        <Paper p="sm" mt="xs" bg="var(--mantine-color-gray-light)">
            <Stack gap="sm">
                <div className="recorder-media-container">
                    {!capturedBlob ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={
                                facingMode === 'user'
                                    ? 'recorder-media-element recorder-media-flipped'
                                    : 'recorder-media-element'
                            }
                        />
                    ) : (
                        previewUrl && (
                            <img src={previewUrl} alt={t('capturedPhoto')} className="recorder-media-element" />
                        )
                    )}
                    <canvas ref={canvasRef} className="recorder-media-hidden" />
                    {isLoading && !capturedBlob && (
                        <div className="recorder-media-loading">
                            <Loader color="white" size="md" />
                        </div>
                    )}
                </div>

                <Group justify="space-between" align="center" gap="xs">
                    <div>
                        {!capturedBlob && (
                            <Button
                                size="xs"
                                variant="default"
                                leftSection={<IconRotate size={16} />}
                                onClick={handleSwitchFacingMode}
                                disabled={isLoading}
                            >
                                {t('switchCamera')}
                            </Button>
                        )}
                    </div>

                    <Group gap="xs" align="center">
                        {!capturedBlob ? (
                            <Button
                                size="xs"
                                leftSection={<IconCamera size={16} />}
                                onClick={handleCapture}
                                disabled={isLoading || !isReady}
                            >
                                {t('takePhoto')}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconRotate size={16} />}
                                    onClick={handleRetake}
                                >
                                    {t('retakePhoto')}
                                </Button>
                                <Button size="xs" leftSection={<IconCheck size={16} />} onClick={handleAccept}>
                                    {t('acceptPhoto')}
                                </Button>
                            </>
                        )}

                        <DeleteActionButton onClick={() => handleDiscard()} />
                    </Group>
                </Group>
            </Stack>
        </Paper>
    );
}

export interface ImageInputProps {
    label?: ReactNode;
    description?: ReactNode;
    placeholder?: string;
    error?: ReactNode;
    required?: boolean;
    value: File | null;
    onChange: (file: File | null) => void;
    accept?: string;
    disabled?: boolean;
}

export function ImageInput({
    label,
    description,
    error,
    required,
    value,
    onChange,
    accept = 'image/*',
    disabled,
}: ImageInputProps) {
    const { t } = useTranslation();
    const [cameraActive, setCameraActive] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (value) {
            const url = URL.createObjectURL(value);
            setPreviewUrl(url);
            setCameraActive(false);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setPreviewUrl(null);
        }
    }, [value]);

    const handleCaptureFile = useCallback(
        (file: File) => {
            setCameraActive(false);
            onChange(file);
        },
        [onChange],
    );

    const handleCancelCamera = useCallback(() => {
        setCameraActive(false);
    }, []);

    const handleRemove = () => {
        onChange(null);
        setCameraActive(false);
    };

    const [requestingCamera, setRequestingCamera] = useState(false);

    const handleToggleCamera = async () => {
        if (!cameraActive) {
            if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                notifications.show({
                    id: 'camera-status-error',
                    color: 'red',
                    title: t('camera'),
                    message: t('cameraPermissionDenied'),
                });
                return;
            }

            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const status = await navigator.permissions.query({ name: 'camera' });
                    if (status.state === 'denied') {
                        notifications.show({
                            id: 'camera-status-error',
                            color: 'red',
                            title: t('camera'),
                            message: t('cameraPermissionDenied'),
                        });
                        return;
                    }
                } catch {
                    void 0;
                }
            }

            setRequestingCamera(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false,
                });
                stream.getTracks().forEach((track) => track.stop());
                setCameraActive(true);
            } catch {
                notifications.show({
                    id: 'camera-status-error',
                    color: 'red',
                    title: t('camera'),
                    message: t('cameraPermissionDenied'),
                });
            } finally {
                setRequestingCamera(false);
            }
        } else {
            setCameraActive(false);
        }
    };

    return (
        <Input.Wrapper label={label} description={description} error={error} required={required}>
            {!value ? (
                <>
                    <Group grow gap="xs">
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconCamera size={16} />}
                            loading={requestingCamera}
                            disabled={disabled || requestingCamera}
                            onClick={() => void handleToggleCamera()}
                        >
                            {t('takePhotoWithCamera')}
                        </Button>
                        <FileButton
                            onChange={(file) => {
                                setCameraActive(false);
                                onChange(file);
                            }}
                            accept={accept}
                            disabled={disabled}
                        >
                            {(props) => (
                                <Button
                                    {...props}
                                    size="xs"
                                    variant="default"
                                    leftSection={<IconUpload size={16} />}
                                    disabled={disabled}
                                >
                                    {t('uploadFromDisk')}
                                </Button>
                            )}
                        </FileButton>
                    </Group>

                    {cameraActive && (
                        <CameraCaptureSection onCapture={handleCaptureFile} onCancel={handleCancelCamera} />
                    )}
                </>
            ) : (
                <Paper p="xs" withBorder>
                    <Group justify="space-between" align="center" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" className="file-preview-info">
                            <Avatar src={previewUrl} radius="sm" size="md">
                                <IconPhoto size={16} />
                            </Avatar>
                            <Box className="file-preview-info">
                                <Text size="xs" fw={500} truncate title={value.name}>
                                    {value.name}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {(value.size / 1024).toFixed(1)} KB
                                </Text>
                            </Box>
                        </Group>
                        <DeleteActionButton onClick={() => handleRemove()} />
                    </Group>
                </Paper>
            )}
        </Input.Wrapper>
    );
}
