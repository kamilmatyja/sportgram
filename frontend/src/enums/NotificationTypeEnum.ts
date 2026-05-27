export enum NotificationTypeEnum {
    CONVERSATION = 1,
    EVENT = 2,
    EVENT_STATUS = 3,
    EVENT_LIST = 4,
    EVENT_LIST_STATUS = 5,
    EVENT_RESULT = 6,
    FEED_STATUS = 7,
    FEED_COMMENT = 8,
    FEED_COMMENT_STATUS = 9,
    FEED_REACTION = 10,
    FEED_REACTION_STATUS = 11,
    FRIEND = 12,
    FRIEND_STATUS = 13,
    GOAL_PARTICIPANT = 14,
    GOAL_PARTICIPANT_STATUS = 15,
    GOAL_RESULT = 16,
    GOAL_RESULT_STATUS = 17,
    GOAL_STATUS = 18,
    PAGE_PARTICIPANT = 19,
    PAGE_PARTICIPANT_STATUS = 20,
    PAGE_FOLLOW = 21,
    PAGE_FOLLOW_STATUS = 22,
    PAGE_STATUS = 23,
    STORY_STATUS = 24,
    TRAINING_PARTICIPANT = 25,
    TRAINING_PARTICIPANT_STATUS = 26,
    TRAINING_STATUS = 27,
    USER_STATUS = 28,
}

export namespace NotificationTypeEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(NotificationTypeEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`notificationTypes.${key.toLowerCase()}`)
            }));
    };
}