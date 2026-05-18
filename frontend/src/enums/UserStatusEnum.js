export const UserStatusEnum = {
    PENDING: 1,
    ACCEPTED: 2,
    BANNED: 3,
    getOptions: (t) => [
        ...Object.entries(UserStatusEnum)
            .filter(([key]) => key !== 'getOptions')
            .map(([key, value]) => ({ value, label: t(`userStatuses.${key.toLowerCase()}`) }))
    ]
};
