export enum NotificationStatusEnum {
    NOT_SENT = 1,
    SENT = 2,
    READ = 3,
}

export namespace NotificationStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(NotificationStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`notificationStatuses.${key.toLowerCase()}`),
            }));
    };
}
