export enum ConversationStatusEnum {
    SENT = 1,
    READ = 2,
}

export namespace ConversationStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(ConversationStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`conversationStatuses.${key.toLowerCase()}`),
            }));
    };
}
