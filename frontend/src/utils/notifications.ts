import { notifications } from '@mantine/notifications';
import { getErrorMessage } from '../api/client';

export function notifySuccess(message: string, title?: string) {
    notifications.show({ title, message, color: 'green' });
}

export function notifyError(err: unknown, title?: string) {
    notifications.show({ title, message: getErrorMessage(err), color: 'red' });
}
