export enum PushSubscriptionStatusEnum {
    ACTIVE = 1,
    INACTIVE = 2,
    REVOKED = 3,
}

export namespace PushSubscriptionStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(PushSubscriptionStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`pushSubscriptionStatuses.${key.toLowerCase()}`),
            }));
    };
}
